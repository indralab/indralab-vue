import * as dispComponents from './components'

const install = (Vue) => {
  Vue.prototype.$curation_url = "";
  Vue.prototype.$curation_list_url = "";
  Object.values(dispComponents).forEach(dispComponent => {
    Vue.use(dispComponent);
  })
};

if (typeof window != 'undefined' && window.Vue) {
  install(window.Vue)
}

export default install

export {default as TimeView} from './components/TimeView'
export {default as AmountView} from './components/AmountView'
