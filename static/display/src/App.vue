<template>
  <div id="app">
    <button v-on:click="changeDay(1)">Previous</button>
    <button v-on:click="changeDay(-1)">Next</button>
    <TimeView :day="day"></TimeView>
  </div>
</template>

<script>
import TimeView from './components/TimeView.vue'

export default {
  name: 'app',
  components: {
    TimeView
  },
  data: function(){
    return {
      day: 0
    }
  },
  methods: {
    changeDay: function(delta) {
      this.day = this.day + delta;
    }
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
