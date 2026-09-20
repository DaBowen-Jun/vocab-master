import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // base 设为相对路径，打包产物可部署到任意子目录/子路径而不白屏
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // 允许任意主机头，便于在 Cloud Studio 等子域名下预览
    allowedHosts: true,
    // 忽略后台生成脚本（G1 / en50k 词表等）频繁写入的目录，
    // 避免 chokidar 监视临时文件时因 EBUSY 崩溃导致 dev 服务器打不开
    watch: {
      ignored: [/\/(node_modules|\.git|scripts|dist|dist-server)\//, /\.tmp$/, /\.mjs$/],
    },
  },
  preview: {
    host: true,
    port: 4173,
    // 允许任意主机头，部署到子域名时不触发 Vite 的主机校验拦截
    allowedHosts: true,
  },
})
