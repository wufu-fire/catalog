<template>
    <div class="layer">
        <ul v-if="!!catalogList" class="list">
            <li v-for="(item, index) in catalogList.children.values" class="item">
                <span v-if="item.type=='DIRECTORY'" class="arrow" :class="{'open': item.open}"></span>
                <span v-if="item.type=='DIRECTORY'" class="floder" @click.prevent="toggle(item)">{{item.path.name}}</span>
                <span v-else class="file">{{item.path.name}}</span>
                <item v-if="!!item.children && item.open" :treeList="item.children"></item>
            </li>
        </ul>
    </div>
</template>

<script>

export default {
    name: "item",
    props: ['treeList'],
    data(){
        return {
            catalogList: this.treeList,
        }
    },
    methods:{
        toggle(item){
            item.type == 'DIRECTORY' ? item.open = !item.open : ""
        }
    }
}
</script>

<style lang="less" rel="stylesheet/less">
    @import './index';
</style>
