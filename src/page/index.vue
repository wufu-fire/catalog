<template>
<div class="catalog-container">
    <div id="resizeable" class="tree" :style="styleObject">
        <div class="toggle">
            <div v-if="!!userInfo" class="user-info">
                <div>author:{{userInfo.owner.name}}</div>
                <div>projectName:{{userInfo.name}}</div>
            </div>
            <div class="btn" @click="openClose">收起打开</div>
        </div>
        <Item v-if="!!treeList" :treeList="treeList" :urlParmas="urlParmas" :setPageUrl="setPageUrl" :iframeLoad="iframeLoad"></Item>
    </div>
    <div id="bars" class="bar"></div>

    <div id='content'>
        <iframe id="contetn-html" class="inner-html" ref="iframe"  :src="pageUrl" @load="iframeLoad"></iframe>
        <div v-if="loadHtml" class="loading">
            <div class="title">loading...</div>
        </div>
        <div v-if="isDrag" class="isdraging"></div>
    </div>
</div>
</template>

<script>
import queryString from 'query-string'
import 'whatwg-fetch'
import Item from '../components/item/index.vue'

const urlParams = queryString.parse(location.search)
// 
export default {
    data(){
        return{
            treeList: null,
            pageUrl: location.href,
            loadHtml: true,
            urlParmas: {
                dynamicUrl: location.href.split('?')[0].split('/').slice(5,10).join('/'),  //接口url中动态部分
                path: urlParams.path,
                branch: urlParams.branch || "master",
                host: location.href.split('?')[0].split('/')[3] == "v2" ? "//git.dianpingoa.com/rest/api/2.0/" : "//git.dianpingoa.com/rest/api/1.0/",
                storageName: location.href.split('?')[0].split('/')[8]+'~'+(urlParams.branch || "master")
            },
            ownerUrl: location.href.split('?')[0].split('/').slice(5,9).join('/'),
            userInfo: null,
            styleObject: {
                width: "300px"
            },
            isDrag: false
        }
    },
    components: {
        Item
    },
    mounted(){
        // const pushState = history.pushState
        // history.pushState = function () {
            
        //     pushState.apply(history, arguments);
        //     alert(location.href)
        // };
        this.init()
        this.draggleRize(document.getElementById('bars'), document.getElementById('resizeable'))
        this.insertJsForIframe()
    },
    methods: {
        // 初始化
        init(){
            this.getFirstList()
            // this.getOwner()
            // 删除原节点
            let child = document.getElementById("root")
            child.parentNode.removeChild(child)
        },
        // 加载页面
        iframeLoad(){
            this.loadHtml = false
            let $iframePage = this.getFrameDoc('contetn-html'),
                $iframeWin = document.querySelector('.inner-html').contentWindow
            $iframePage.onclick=function(e){
                setTimeout(function(){
                    let url = document.querySelector('.inner-html').contentWindow.location.href  //可以获取当前iframe的url
                    window.history.pushState(null, null, url)
                }, 5000)     
            } 
        },
        // 在iframe中嵌入js
        insertJsForIframe(){
            let newScript = document.createElement("script");
            let text = `
                var pushState = history.pushState;
                history.pushState = function () {
                    pushState.apply(history, arguments);
                    window.parent.history.pushState(null, null, location.href)
                };
            `
            let inlineScript = document.createTextNode(text);
            newScript.appendChild(inlineScript); 
            this.$refs.iframe.contentWindow.document.getElementsByTagName("head")[0].appendChild(newScript);
        },
        // iframe document
        getFrameDoc(frame){
            let oIframe = document.getElementById(frame), oDoc = oIframe.contentWindow || oIframe.contentDocument
            !!oDoc.document ? oDoc = oDoc.document : ""
            return oDoc
        },
        // 更新iframe
        setPageUrl(currentUrl){
            this.loadHtml = true
            this.pageUrl = currentUrl
        },
        // 获取树形数据
        getFirstList: async function(){
            let rootObj = {},
                url = `${this.urlParmas.host}${this.urlParmas.dynamicUrl}/?at=${this.urlParmas.branch}&start=0&limit=5000`,
                arrDirectroy = [],
                arrFile = [],
                originArr

            let childrenRes = await fetch(url, {
                credentials: 'include'
            })

            let childrenJson = await childrenRes.json()

            originArr = childrenJson.children.values

            for(let i=0; i<originArr.length; i++){
                originArr[i].open = false
                originArr[i].isLoaded = false
                originArr[i].isLoading = false
                originArr[i].parent = childrenJson.path.toString
                originArr[i].type === "DIRECTORY" ? arrDirectroy.push(originArr[i]) : arrFile.push(originArr[i])
            }

            childrenJson.children.values = arrDirectroy.concat(arrFile)
            // 跟踪数据
            this.globalTree = childrenJson
            // 
            this.treeList = childrenJson
        },
        // 获取仓库人
        getOwner: async function(){
            let owner = await fetch(`${this.urlParmas.host}${this.ownerUrl}`, {
                credentials: 'include'
            })
            this.userInfo = await owner.json()
        },
        // 拖动
        draggleRize(el, contaner){
            //初始化参数
            let els, initX, initXnum, that = this

            //鼠标的 X 和 Y 轴坐标
            let x = 0,  
                y = 0;
            //鼠标按下事件
            el.onmousedown = function (e) {
                that.isDrag = true
                els = contaner.style
                initX = els.width
                initXnum = Number(initX.replace(/[^0-9]/ig, ""))
                //按下元素后，计算当前鼠标与对象计算后的坐标
                x = e.clientX - el.offsetWidth,
                y = e.clientY - el.offsetHeight;
                //在支持 setCapture 做些东东
                if (!!el.setCapture) {
                    el.setCapture(),
                        //设置事件
                        el.onmousemove = function (ev) {
                            mouseMove(ev || event)
                        },
                        el.onmouseup = mouseUp
                } else {
                    document.addEventListener("mousemove", mouseMove, false)
                    document.addEventListener("mouseup", mouseUp, false)
                }
                //防止默认事件发生
                e.preventDefault()
            }
            //移动事件
            function mouseMove(e) {
                //运算中...
                els.width = initXnum + e.clientX - x + 'px'
            }
            //停止事件
            function mouseUp() {
                that.isDrag = false
                if (!!el.releaseCapture) {
                    el.releaseCapture()
                    el.onmousemove = el.onmouseup = null
                } else {
                    document.removeEventListener("mousemove", mouseMove, false)
                    document.removeEventListener("mouseup", mouseUp, false)
                }
            }
        },
        openClose(){

        }
    }
}
</script>

<style lang="less" rel="stylesheet/less">
    @import './index';
</style>
