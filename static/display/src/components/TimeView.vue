<template>
  <div class="time-view">
    <apexchart
        type="rangeBar"
        height=300
        :options="chartOptions"
        :series="series">
    </apexchart>
  </div>
</template>

<script>
  import VueApexCharts from 'vue-apexcharts'
  export default {
    name: "TimeView",
    components: {
      apexchart: VueApexCharts
    },
    props: {
      day: Number
    },
    data: function() {
      return {
        date_data: [],
        chartOptions: {
          chart: {
            height: 450,
            type: 'rangeBar'
          },
          plotOptions: {
            bar: {
              horizontal: true,
              barHeight: '80%',
            }
          },
          xaxis: {
            type: 'datetime',
            min: 0,
            max: 28
          },
          legend: {
            position: 'top',
            horizontalAlign: 'left'
          }
        },
      }
    },
    methods: {
      getDates: async function() {
        const resp = await fetch(`http://localhost:5000/data/runtimes`, {method: 'GET'});
        this.date_data = await resp.json();
      },
    },
    created: function() {
      this.getDates();
    },
    computed: {
      series: function() {
        let final_stage_name;
        let ret = {};
        let start = Math.min(Math.max(this.day - 1, 0), this.date_data.length - 1);
        let stop = Math.max(Math.min(this.day + 2, this.date_data.length), 1);
        for (let day_obj of this.date_data.slice(start, stop) ) {
          for (let [stage_name, stage_data] of Object.entries(day_obj['times'])) {
            for (let [flavor_name, times] of Object.entries(stage_data)) {
              if (Object.keys(stage_data).length > 1)
                if (flavor_name === 'all')
                  continue;
                else
                  final_stage_name = stage_name  + '-' + flavor_name;
              else
                final_stage_name = stage_name;

              if ( !(final_stage_name in ret) )
                ret[final_stage_name] = {name: final_stage_name, data: []};

              for (let timespan of times) {
                ret[final_stage_name].data.push({
                  x: day_obj['day_str'],
                  y: timespan
                })
              }
            }
          }
        }
        return Object.values(ret);
      }
    }
  }
</script>

<style scoped>
</style>