<template>
  <div class="amount-view">
    <select v-model="stage">
      <option value="" selected disabled hidden>
        Select a stage to view...
      </option>
      <option v-for="stage in options"
              :value="stage"
              :key="stage">
        {{ stage }}
      </option>
    </select>
    <button v-on:click="getDataFile">Load</button>
    <apexchart
        type="line"
        height=800
        :options="chartOptions"
        :series="series">
    </apexchart>
  </div>
</template>

<script>
  import VueApexCharts from 'vue-apexcharts'

  export default {
    name: "AmountView",
    components: {
      apexchart: VueApexCharts,
    },
    data: function() {
      return {
        options: [],
        amount_data: null,
        stage: null,
        chartOptions: {
            chart: {
              height: 350,
              type: 'line',
              id: 'areachart-2'
            },
            dataLabels: {
              enabled: false
            },
            stroke: {
              curve: 'straight'
            },
            grid: {
              padding: {
                right: 30,
                left: 20
              }
            },
            title: {
              text: 'Line with Annotations',
              align: 'left'
            },
            xaxis: {
              type: 'numeric',
            },
          },
      }
    },
    methods: {
      getDataFile: async function() {
        const resp = await fetch(`http://localhost:5000/data/${this.stage}`, {method: 'GET'});
        this.amount_data = await resp.json();
        // let cats = new Set();

      },
      getStageOptions: async function() {
        const resp = await fetch('http://localhost:5000/listdata', {method: 'GET'});
        this.options = await resp.json()
      }
    },
    created: function() {
      this.getStageOptions();
    },
    computed: {
      series: function() {
        if (!this.amount_data)
          return [];

        let ret = [];
        for (let [name, measures] of Object.entries(this.amount_data.total)) {
          ret.push({name: name, data: Object.values(measures)});
        }
        return ret
      }
    }
  }
</script>

<style scoped>

</style>