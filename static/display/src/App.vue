<template>
  <div id="app">
    <TimeView :day="day"></TimeView>
    <AmountView :day="day"></AmountView>
  </div>
</template>

<script>
import TimeView from './components/TimeView.vue'
import AmountView from './components/AmountView.vue'

export default {
  name: 'app',
  components: {
    TimeView,
    AmountView
  },
  data: function(){
    return {
      day: 0
    }
  },
  methods: {
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
