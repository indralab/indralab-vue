<template>
  <div id="app">
    <
    <TimeView :day="0"></TimeView>
  </div>
</template>

<script>
import TimeView from './components/TimeView.vue'

export default {
  name: 'app',
  components: {
    TimeView
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
