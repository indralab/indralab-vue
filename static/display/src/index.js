import TimeView from './components/TimeView.vue'
import AmountView from './components/AmountView.vue'


export default {
  install: function(Vue) {
    Vue.component(TimeView.name, TimeView);
    Vue.component(AmountView.name, AmountView);
  }
}
