<template>
<div class="catalog-container">
    <!--
    <Item></Item>
    -->
    <Item v-if="!!treeList" class="tree" :treeList="treeList" :urlParmas="urlParmas"></Item>
</div>
</template>

<script>
import queryString from 'query-string'
import 'whatwg-fetch'
import Item from '../components/item/index.vue'
import dataObj from './data.js'

const urlParams = queryString.parse(location.search)
// 
export default {
    data(){
        return{
            treeList: null,
            urlParmas: {
                dynamicUrl: location.href.split('?')[0].split('/').slice(5,10).join('/'),  //接口url中动态部分
                path: urlParams.path,
                branch: urlParams.branch || "master",
                host: "//git.dianpingoa.com/rest/api/2.0/",
            },
            json: '',
            cleanList: [{

            }],
        }
    },
    components: {
        Item
    },
    mounted(){
        this.init()
    },
    methods: {
        init(){
            this.getFirstList()
            // this.getGitList()
        },
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

            this.treeList = childrenJson
        },
        /*
        * 广度遍历，获取每个数据
        * rootObj为默认根节点，里面参数为初始值
        * queue为队列
        * url获取数据的url动态变化
        */
        getGitList: async function(){
            // 初始化根节点
            let rootObj = {
                    path:{
                        components: [],
                        toString: ''
                    },
                    type: "DIRECTORY",
                    parent: ""
                }, 
                queue = [], 
                url

            //根节点进入队列
            queue.unshift(rootObj)   
            
            // 广度遍历
            while(queue.length != 0){
                let item = queue.shift()

                // 为文件夹时候，继续遍历
                if(item.type === 'DIRECTORY'){
                    
                    // url根据目录进行改变，当parent（自己设计）为空时，那么就是根目录，否则为正常遍历目录
                    item.parent == '' ? this.path = item.path.toString : this.path = `${item.parent}/${item.path.toString}`
                    
                    let url = `${this.host}${this.dynamicUrl}/${this.path}?at=${this.branch}&start=0&limit=5000`
                    console.log("url", url)
                    //获取当前目录数据
                    let childrenRes = await fetch(url, {
                        credentials: 'include'
                    })
                    let childrenJson = await childrenRes.json()

                    // length大于0，则为非根目录
                    if(item.path.components.length > 0){ 
                        // 根据对象的引用性质，obj1 = obj2, obj1.a=1, 那么obj2.a为1。当item改变的时候，rootObj引用item部分保持同步。
                        item.children = childrenJson
                    }else{
                        // 根目录的时候
                        
                        let arrDirectroy = [],
                            arrFile = [],
                            originArr = childrenJson.children.values
                        for(let i=0; i<originArr.length; i++){
                            originArr[i].type === "DIRECTORY" ? arrDirectroy.push(originArr[i]) : arrFile.push(originArr[i])
                        }
                        childrenJson.children.values = arrDirectroy.concat(arrFile)
                        rootObj = childrenJson
                    }
                    // 获取子节点
                    let children = childrenJson.children.values 

                    // 子节点进入队列
                    for (let i = 0; i < children.length; i++){
                        // 标志位，为了获取当前文件夹的访问url
                        children[i].parent = childrenJson.path.toString
                        children[i].open = false
                        children[i].isLoaded = false
                        // 进入队列
                        queue.push(children[i])
                    }
                }   
            }
            console.log("rootObj", rootObj)
            this.treeList = rootObj
        } 
    }
}
</script>

<style lang="less" rel="stylesheet/less">
    @import './index';
</style>
