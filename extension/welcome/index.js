var currentStep = 1;

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('mainBtn').addEventListener('click', function () {
    nextStep();
  });
});

function nextStep() {
  burst();

  if (currentStep === 1) {
    document.getElementById('num1').textContent = '✓';
    document.getElementById('num1').classList.add('done');
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('done-step');
    document.getElementById('chromePanel').style.display = 'none';
    document.getElementById('step2').classList.add('active');
    document.getElementById('mainBtn').textContent = '➡️ Next';
    currentStep = 2;

  } else if (currentStep === 2) {
    document.getElementById('num2').textContent = '✓';
    document.getElementById('num2').classList.add('done');
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step2').classList.add('done-step');
    document.getElementById('step3').classList.add('active');
    document.getElementById('mainBtn').textContent = '🚀 Start Protecting Myself!';
    currentStep = 3;

  } else if (currentStep === 3) {
    document.getElementById('num3').textContent = '✓';
    document.getElementById('num3').classList.add('done');
    document.getElementById('step3').classList.remove('active');
    document.getElementById('step3').classList.add('done-step');
    document.getElementById('mainBtn').style.display = 'none';
    try {
      chrome.tabs.getCurrent(function (tab) {
        if (tab) chrome.tabs.remove(tab.id);
      });
    } catch (e) {}
  }
}

function burst() {
  var colors = ['#6366f1','#8b5cf6','#22c55e','#f59e0b','#ef4444','#38bdf8','#ec4899'];
  var btn = document.getElementById('mainBtn');
  var rect = btn.getBoundingClientRect();
  for (var i = 0; i < 32; i++) {
    var el = document.createElement('div');
    el.className = 'fleck';
    var size = 5 + Math.random() * 8;
    var dx = (Math.random() - 0.5) * 220;
    el.style.cssText =
      'left:' + (rect.left + rect.width / 2) + 'px;' +
      'top:' + rect.top + 'px;' +
      'width:' + size + 'px;height:' + size + 'px;' +
      'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
      'border-radius:' + (Math.random() > 0.5 ? '50%' : '3px') + ';' +
      '--d:' + (0.7 + Math.random() * 0.6) + 's;' +
      '--dl:' + (Math.random() * 0.1) + 's;' +
      '--dx:' + dx + 'px;';
    document.body.appendChild(el);
    (function (e) { setTimeout(function () { e.remove(); }, 1500); })(el);
  }
}