function pointOf(event: TouchEvent | MouseEvent) {
  const touch = 'touches' in event ? event.touches[0] : undefined
  return {
    x: touch?.clientX ?? ('clientX' in event ? event.clientX : 0),
    y: touch?.clientY ?? ('clientY' in event ? event.clientY : 0),
  }
}

/** 按住约 0.5 秒触发。移动超过 8px 取消。松手后的第一次点击被吞掉。 */
export function useLongPress() {
  let timer: ReturnType<typeof setTimeout> | null = null
  let originX = 0
  let originY = 0
  let suppressClick = false

  function start(event: TouchEvent | MouseEvent, fire: () => void) {
    const point = pointOf(event)
    originX = point.x
    originY = point.y
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      suppressClick = true
      fire()
    }, 500)
  }

  function move(event: TouchEvent | MouseEvent) {
    if (!timer) return
    const point = pointOf(event)
    if (Math.abs(point.x - originX) > 8 || Math.abs(point.y - originY) > 8) {
      clearTimeout(timer)
      timer = null
    }
  }

  function end() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  function takeSuppressedClick() {
    if (!suppressClick) return false
    suppressClick = false
    return true
  }

  function reset() {
    end()
    suppressClick = false
  }

  return { start, move, end, takeSuppressedClick, reset }
}
