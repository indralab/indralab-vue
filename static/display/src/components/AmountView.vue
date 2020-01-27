<template>
  <div class="amount-view">
    <div class="form">
      <div>
        <multiselect v-model="stage"
                     :searchable="true"
                     :options="stages"
                     placeholder="Select a stage"></multiselect>
        <button v-on:click="getStageData">Load</button>
      </div>
      <div v-if="measures">
        <multiselect v-model="selected_measures"
                     :options="measures"
                     :multiple="true"
                     placeholder="Select measure"></multiselect>
      </div>
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
  import Multiselect from 'vue-multiselect'

  export default {
    name: "AmountView",
    components: {
      apexchart: VueApexCharts,
      multiselect: Multiselect,
    },
    data: function() {
      return {
        stages: [],
        stage: null,
        measures: null,
        selected_measures: [],
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
        this.selected_measures = null;
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
        if (!this.amount_data || !this.selected_measures)
          return [];

        let ret = [];
        let ret_name;
        for (let measure of this.selected_measures) {
          for (let [name, measures] of Object.entries(this.amount_data[measure])) {
            ret_name = name;
            if (this.selected_measures.length > 1)
              ret_name = ret_name + '-' + measure;
            ret.push({name: ret_name, data: measures})
          }
        }
        return ret
      }
    }
  }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
  .form {
    width: 20%;
    margin: 0 auto;
  }
</style>