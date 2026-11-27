<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style>
page {
  background-color: #0f1219;
  color: #f2f4f8;
}

.page.enter-forward {
  animation: rootInFromRight 0.34s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.page.enter-back {
  animation: rootInFromLeft 0.34s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.page.enter-fade {
  animation: rootFadeIn 0.28s ease both;
}

.page.leave-forward {
  animation: rootOutToLeft 0.2s ease both;
}

.page.leave-back {
  animation: rootOutToRight 0.2s ease both;
}

@keyframes rootInFromRight {
  from {
    opacity: 0;
    transform: translateX(28px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes rootInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-28px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes rootFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes rootOutToLeft {
  from {
    opacity: 1;
    transform: none;
  }
  to {
    opacity: 0;
    transform: translateX(-18px);
  }
}

@keyframes rootOutToRight {
  from {
    opacity: 1;
    transform: none;
  }
  to {
    opacity: 0;
    transform: translateX(18px);
  }
}
</style>
