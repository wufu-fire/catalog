<template>
<div class="catalog-container">
    <div id="watch" @click="watchUrl"></div>
    <div id="resizeable" ref="tree" class="tree" :style="styleObject" :class="{'Hidden': isHidden}">
        <div class="toggle">
            <div v-if="!!userInfo" class="user-info">
                <div>author:{{userInfo.owner.name}}</div>
                <div>projectName:{{userInfo.name}}</div>
            </div>
            <div v-if="!startCollapse" class="close-btn" @click="openClose(0)"></div>
        </div>
        <Item v-if="!!treeList && !!urlParmas" :treeList="treeList" :urlParmas="urlParmas" :setPageUrl="setPageUrl" :iframeLoad="iframeLoad"></Item>
    </div>
    <div id="bars" class="bar" :class="{'Hidden': isHidden}"></div>
    <div v-if="startCollapse" class="open-btn-wrapper" :class="{'Hidden': isHidden}">
        <div class="open-btn" @click="openClose(1)"></div>
    </div>
    <div class='catalog-content'>
        <iframe id="contetn-html" class="inner-html" ref="iframe"  :src="pageUrl" @load="iframeLoad"></iframe>
        <div v-if="loadHtml" class="loading">
            <div class="title">loading...</div>
        </div>
        <div v-if="isDrag" class="isdraging"></div>
    </div>
</div>
</template>

<script>
import queryString from "query-string";
import "whatwg-fetch";
import Item from "../components/item/index.vue";
const urlParams = queryString.parse(location.search);
export default {
  data() {
    return {
      treeList: null,
      pageUrl: location.href,
      loadHtml: true,
      urlParmas: null,
      ownerUrl: null,
      userInfo: null,
      styleObject: {
        width: "220px"
      },
      isDrag: false,
      startCollapse: false,
      isHidden: false
    };
  },
  components: {
    Item
  },
  mounted() {
    let that = this;
    // 删除原节点
    let child = document.getElementById("root");
    // 判断是v1还是v2版本
    !!child ? child.parentNode.removeChild(child) : "";
    //拖动
    this.draggleRize(
      document.getElementById("bars"),
      document.getElementById("resizeable")
    );
    // 插入iframe
    this.insertJsForIframe();
    if (location.href.includes("browse")) {
      this.initData();
      this.getFirstList();
    } else {
      this.isHidden = true;
    }
    chrome.extension.onMessage.addListener(function(
      request,
      sender,
      sendResponse
    ) {
      that.isHidden = !request.isSelected;
      localStorage.setItem("catalogIsPrevent", request.isSelected);
    });
  },
  methods: {
    // 监听iframe内部的url
    watchUrl() {
      let url = location.href;
      if (url.includes("browse")) {
        // 监听为浏览code页面
        this.initData();
        this.getFirstList();
        this.openClose(1);
        this.isHidden = false;
      } else {
        // 监听当不是code浏览页面
        this.openClose(0);
        this.isHidden = true;
      }
    },
    // 初始化参数
    initData() {
      this.urlParmas = {
        dynamicUrl:
          location.href
            .split("?")[0]
            .split("/")
            .slice(5, 9)
            .join("/") + "/browse", //接口url中动态部分
        path: urlParams.path,
        branch: urlParams.branch || "master",
        host:
          location.href.split("?")[0].split("/")[3] == "v2"
            ? "//git.dianpingoa.com/rest/api/2.0/"
            : "//git.dianpingoa.com/rest/api/1.0/"
      };
      this.ownerUrl = location.href
        .split("?")[0]
        .split("/")
        .slice(5, 9)
        .join("/");
    },
    // 加载页面
    iframeLoad() {
      this.loadHtml = false;
    },
    // 在iframe中嵌入js
    insertJsForIframe() {
      let newScript = document.createElement("script");
      let text = `
                var pushState = history.pushState;
                history.pushState = function () {
                    pushState.apply(history, arguments);
                    window.parent.history.pushState(null, null, location.href);
                    window.parent.document.getElementById('watch').click();
                };
            `;
      let inlineScript = document.createTextNode(text);
      newScript.appendChild(inlineScript);
      this.$refs.iframe.contentWindow.document
        .getElementsByTagName("head")[0]
        .appendChild(newScript);
    },
    // 更新iframe
    setPageUrl(currentUrl) {
      this.loadHtml = true;
      this.pageUrl = currentUrl;
    },
    // 获取树形数据
    getFirstList: async function() {
      let rootObj = {},
        url = `${this.urlParmas.host}${this.urlParmas.dynamicUrl}/?at=${
          this.urlParmas.branch
        }&start=0&limit=5000`,
        arrDirectroy = [],
        arrFile = [],
        originArr;

      let childrenRes = await fetch(url, {
        credentials: "include"
      });

      let childrenJson = await childrenRes.json();
      originArr = childrenJson.children.values;

      for (let i = 0; i < originArr.length; i++) {
        originArr[i].open = false;
        originArr[i].isLoaded = false;
        originArr[i].isLoading = false;
        originArr[i].parent = childrenJson.path.toString;
        originArr[i].type === "DIRECTORY"
          ? arrDirectroy.push(originArr[i])
          : arrFile.push(originArr[i]);
      }

      childrenJson.children.values = arrDirectroy.concat(arrFile);
      // 跟踪数据
      this.globalTree = childrenJson;
      //
      this.treeList = childrenJson;
    },
    // 获取仓库人
    getOwner: async function() {
      let owner = await fetch(`${this.urlParmas.host}${this.ownerUrl}`, {
        credentials: "include"
      });
      this.userInfo = await owner.json();
    },
    // 拖动
    draggleRize(el, contaner) {
      //初始化参数
      let els,
        initX,
        initXnum,
        that = this;

      //鼠标的 X 和 Y 轴坐标
      let x = 0,
        y = 0;
      //鼠标按下事件
      el.onmousedown = function(e) {
        that.isDrag = true;
        els = contaner.style;
        initX = els.width;
        initXnum = Number(initX.replace(/[^0-9]/gi, ""));
        //按下元素后，计算当前鼠标与对象计算后的坐标
        (x = e.clientX - el.offsetWidth), (y = e.clientY - el.offsetHeight);
        //在支持 setCapture 做些东东
        if (!!el.setCapture) {
          el.setCapture(),
            //设置事件
            (el.onmousemove = function(ev) {
              mouseMove(ev || event);
            }),
            (el.onmouseup = mouseUp);
        } else {
          document.addEventListener("mousemove", mouseMove, false);
          document.addEventListener("mouseup", mouseUp, false);
        }
        //防止默认事件发生
        e.preventDefault();
      };
      //移动事件
      function mouseMove(e) {
        //运算中...
        els.width = initXnum + e.clientX - x + "px";
      }
      //停止事件
      function mouseUp() {
        that.isDrag = false;
        if (!!el.releaseCapture) {
          el.releaseCapture();
          el.onmousemove = el.onmouseup = null;
        } else {
          document.removeEventListener("mousemove", mouseMove, false);
          document.removeEventListener("mouseup", mouseUp, false);
        }
      }
    },
    openClose(val) {
      let width =
        Number(this.$refs.tree.style.width.replace(/[^0-9]/gi, "")) + 10;
      if (val == 0) {
        this.startCollapse = true;
        this.$set(this.styleObject, "marginLeft", "-" + width + "px");
      } else {
        this.startCollapse = false;
        this.$set(this.styleObject, "marginLeft", 0);
      }
    }
  }
};
</script>

<style lang="less" rel="stylesheet/less">
@import "./index";
</style>
