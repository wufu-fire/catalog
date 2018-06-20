<template>
<div class="loading">
    <div class="sk-circle">
        <div v-for="item in 12" class="sk-child" :class="'sk-circle'+(item+1)"></div>
    </div>
</div>
</template>

<script>

export default {
    components: {
        
    }
}
</script>

<style lang="less" rel="stylesheet/less">
@import './index';
</style>
