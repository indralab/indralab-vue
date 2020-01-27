<template>
  <div class="amount-view">
    <div class="form">
      <select v-model="stage">
        <option value="" selected disabled hidden>
          Select a stage to view...
        </option>
        <option v-for="stage in stages"
                :value="stage"
                :key="stage">
          {{ stage }}
        </option>
      </select>
      <button v-on:click="getStageData">Load</button>
    </div>
    <div class="form"
         v-if="measures">
      <select v-model="measure">
        <option value="" selected disabled hidden>
          Select a measure to view...
        </option>
        <option v-for="measure in measures"
               :value="measure"
               :key="measure">
          {{ measure }}
        </option>
      </select>
    </div>
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
        stages: [],
        stage: null,
        measures: null,
        measure: null,
        amount_data: null,
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
      getStageData: async function() {
        if (!this.stage)
          return;
        this.measure = null;
        const resp = await fetch(
          `http://localhost:5000/data/${this.stage}`,
          {method: 'GET'}
          );
        this.amount_data = await resp.json();
        this.measures = Object.keys(this.amount_data);
      },
      getStageOptions: async function() {
        const resp = await fetch('http://localhost:5000/listdata', {method: 'GET'});
        this.stages = await resp.json()
      }
    },
    created: function() {
      this.getStageOptions();
    },
    computed: {
      series: function() {
        if (!this.amount_data || !this.measure)
          return [];

        let ret = [];
        for (let [name, measures] of Object.entries(this.amount_data[this.measure])) {
          ret.push({name: name, data: measures})
        }
        return ret
      }
    }
  }
</script>

<style scoped>

</style>