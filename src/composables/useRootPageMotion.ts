import { onUnmounted, ref } from 'vue'
import { consumeEnterMotion, onRootLeave } from '../services/root-transition'

/** 三个主页面切换时，内容区滑入滑出。 */
export function useRootPageMotion() {
  const motionClass = ref(`enter-${consumeEnterMotion()}`)
  const stopLeave = onRootLeave((motion) => {
    motionClass.value = `leave-${motion}`
  })

  onUnmounted(() => {
    stopLeave()
  })

  return { motionClass }
}
