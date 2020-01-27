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
        height=300
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
        dates: null,
        chartOptions: {
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'straight',
          },
          grid: {
            padding: {
              right: 30,
              left: 20
            }
          },
          xaxis: {
            type: 'datetime',
            title: {
              text: 'Day',
            },
          },
          yaxis: {
            title: {
              text: 'Count'
            }
          }
        },
      }
    },
    methods: {
      getDataFile: async function() {
        const resp = await fetch(`http://localhost:5000/data/${this.stage}`, {method: 'GET'});
        this.amount_data = await resp.json();
        let cats = new Set();
        for (let measures of Object.values(this.amount_data.total)) {
          Object.keys(measures).forEach(date => cats.add(date));
        }
        this.dates = Array.from(cats);
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
        let data;
        for (let [name, measures] of Object.entries(this.amount_data.total)) {
          data = [];
          this.dates.forEach(date => {
            if (measures[date] !== undefined)
              data.push([Number.parseInt(date), measures[date]]);
          });
          ret.push({name: name, data: data});
        }
        return ret
      }
    }
  }
</script>

<style scoped>

</style>