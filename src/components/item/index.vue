<template>
    <div class="layer">
        <ul v-if="!!catalogList" class="list">
            <li v-for="(item, index) in catalogList.children.values" class="item">
                <span v-if="item.type=='DIRECTORY'" class="arrow" :class="{'open': item.open}"></span>
                <span v-if="item.type=='DIRECTORY'" class="floder" @click.prevent="toggle(item, index)">{{item.path.name}}</span>
                <span v-else class="file" @click="linkToPage(item)">{{item.path.name}}</span>  
                <Loading v-if="item.isLoading"></Loading>
                <!--
                <item v-if="!!item.children && item.open" :treeList="item.children" :urlParmas="urlParmas"></item>
                -->
                <item v-if="!!item.children && item.open" :treeList="item.children" :urlParmas="urlParmas" :globalTree="copyGlobalTree" :idx="childIdx"></item>
            </li>
        </ul>
    </div>
</template>

<script>
import 'whatwg-fetch'
import Loading from '../loading/index.vue'

export default {
    name: "item",
    props: ['treeList', "urlParmas", "globalTree", "idx"],
    data(){
        return {
            catalogList: this.treeList,
            copyGlobalTree: this.globalTree,
            childIdx: this.idx
        }
    },
    components: {
        Loading
    },
    mounted(){
        // http://git.dianpingoa.com/rest/api/2.0/projects/babyfe/repos/baby-activity-playing-car
        // http://git.dianpingoa.com/rest/api/2.0/projects/babyfe/repos/baby-activity-playing-car/browse/?at=master&start=0&limit=5000
    },
    methods:{
        toggle(item, index){
            if(item.type == 'DIRECTORY'){
                item.isLoaded ? item.open=!item.open : ""
                this.getChildList(item, index)
            }
        },
        // 获取数据
        getChildList(item, index){
            // 如果已经加载或者正在加载，则不发送请求
            if(item.isLoaded || item.isLoading){
                return
            }
            item.isLoading = true
            let that = this,
                path = item.parent == '' ? item.path.toString : `${item.parent}/${item.path.toString}`,
                url = `${this.urlParmas.host}${this.urlParmas.dynamicUrl}/${path}?at=${this.urlParmas.branch}&start=0&limit=5000`
            fetch(url, {credentials: 'include'})
            .then(function(res) {
                return res.json()
            }).then(function(childrenJson) {
                // 排序
                let arrDirectroy = [],
                    arrFile = [],
                    originArr = childrenJson.children.values
                for(let i=0; i<originArr.length; i++){
                    originArr[i].open = false
                    originArr[i].isLoaded = false
                    originArr[i].isLoading = false
                    originArr[i].parent = childrenJson.path.toString
                    originArr[i].type === "DIRECTORY" ? arrDirectroy.push(originArr[i]) : arrFile.push(originArr[i])
                }
                childrenJson.children.values = arrDirectroy.concat(arrFile)
                //修改状态，防止重复加载
                item.isLoaded = true
                //改变箭头状态
                item.open = true 
                //改变loading状态
                item.isLoading = false

                // 跟踪状态
                let idxArrPre = Array.prototype.map.call(that.childIdx, function(item){
                    return parseInt(item)
                })
                idxArrPre.shift()
                let copyStatus = that.copyGlobalTree, tempStatus
                if(idxArrPre.length===1){
                    copyStatus.children.values[idxArrPre[0]].isLoaded = true
                    copyStatus.children.values[idxArrPre[0]].open = true
                }else{
                    for(let i = 0; i < idxArrPre.length; i++){
                        if(i==0){
                            copyStatus = copyStatus.children.values[idxArrPre[i]]
                        }else if(i == idxArrPre.length - 1){
                            copyStatus.children.children.values[idxArrPre[i]].isLoaded = true
                            copyStatus.children.children.values[idxArrPre[i]].open = true
                        }else{
                            copyStatus = copyStatus.children.children.values[idxArrPre[i]]
                        }
                    }
                }
                // 跟踪数据
                that.childIdx = that.idx + index

                let idxArr = Array.prototype.map.call(that.childIdx, function(item){
                    return parseInt(item)
                })
                idxArr.shift()
                let copy = that.copyGlobalTree, temp
                if(idxArr.length===1){
                    copy.children.values[idxArr[0]].children = childrenJson
                }else{
                    for(let i = 0; i < idxArr.length; i++){
                        if(i==0){
                            copy = copy.children.values[idxArr[i]]
                        }else if(i == idxArr.length - 1){
                            copy.children.children.values[idxArr[i]].children = childrenJson
                        }else{
                            copy = copy.children.children.values[idxArr[i]]
                        }
                    }
                }
                
                console.log("that.copyGlobalTree", that.copyGlobalTree)
                that.$set(item, 'children', childrenJson)
            }).catch(function(ex) {
                console.log('child tree failed', ex)
            })
        },
        // 跳转到指定页面
        linkToPage(item){
            let path = item.parent == '' ? item.path.name : `${item.parent}/${item.path.toString}`,
                url = `${location.href.split('?')[0]}?branch=${this.urlParmas.branch}&path=${path}`
            
            localStorage.setItem(this.urlParmas.storageName, JSON.stringify(this.copyGlobalTree));
            location.href = url
        }
    }
}
</script>
<style lang="less" rel="stylesheet/less">
    @import './index';
</style>
