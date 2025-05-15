var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

document.addEventListener("DOMContentLoaded", function() {
  if (!isMobile) {
    document.location.href = "https://14blox.strangled.net/notMobile"
  }
})
