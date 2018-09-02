## catalog-1

#### 1.获取cookie
- content.js
```
chrome.runtime.sendMessage({text: "hey"}, function(response) {
    console.log("Response: ", response);
});
```

- background.js
```
let token = "";

chrome.cookies.get({ "url": "http://git.dianpingoa.com", "name": "shanghai_sessionid" }, function (cookie) {
    token = cookie.value
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    sendResponse(token);
});
```

#### 2.广度遍历
```
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
    // this.treeList = rootObj
} 
```

#### 在iframe中注入js
将脚本写入即可，监听url，然后传递给外层


### 直接找到监听iframe内部url变化的方法
v2: http://git.dianpingoa.com/v2/sh/projects/babyfe/repos/baby-activity-playing-car/browse?branch=lightmerge&path=html/change-date.html

v1: http://git.dianpingoa.com/v1/sh/projects/babyfe/repos/baby-activity-playing-car/browse/html/change-date.html?at=master&auto=false
