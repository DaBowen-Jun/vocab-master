const base = 'http://71d9119cb5384d4695ac70ff495393ff.codebuddy.cloudstudio.run'
;(async () => {
  const html = await (await fetch(base + '/')).text()
  console.log('font Fredoka link:', /Fredoka/.test(html))
  console.log('font Nunito link :', /Nunito/.test(html))
  const m = html.match(/index-([A-Za-z0-9_-]+)\.js/)
  const jsName = m && m[0]
  console.log('js asset         :', jsName)
  const js = await (await fetch(base + '/assets/' + jsName)).text()
  const checks = {
    'home icon svg (m3 9 9-7)': /m3 9 9-7/.test(js),
    'headphones svg (M3 14h3)': /M3 14h3/.test(js),
    'pen svg (M12 20h9)': /M12 20h9/.test(js),
    'trophy svg (M6 9H4)': /M6 9H4/.test(js),
    'usage label (用法说明)': /用法说明/.test(js),
    'youdao audio (mobile)': /dict\.youdao/.test(js),
    'sw v2 (offline-first)': /vocab-master-v2/.test(js),
    'EMOJI leftover 🎧': /🎧/.test(js),
    'EMOJI leftover 📚': /📚/.test(js),
    'EMOJI leftover 🏆': /🏆/.test(js),
  }
  for (const [k, v] of Object.entries(checks)) console.log((v ? 'PASS ' : 'FAIL ') + k + ':', v)
})().catch((e) => console.log('ERR', e.message))
