// 自定义JavaScript

// 在文档加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取目录大纲切换按钮
  const tocToggler = document.getElementById('toc-toggler');
  if (tocToggler) {
    // 为目录大纲切换按钮添加点击事件
    tocToggler.addEventListener('click', function() {
      // 获取目录大纲区域
      const tocSection = document.getElementById('toc-section');
      if (tocSection) {
        // 切换目录大纲的显示状态
        if (tocSection.classList.contains('hide')) {
          // 隐藏目录大纲
          tocSection.classList.remove('hide');
          document.body.classList.remove('toc-shown');
        } else {
          // 如果侧边栏是展开的，先关闭侧边栏
          const sidebar = document.getElementById('sidebar-section');
          if (sidebar && sidebar.classList.contains('hide')) {
            sidebar.classList.remove('hide');
          }
          // 显示目录大纲
          tocSection.classList.add('hide');
          document.body.classList.add('toc-shown');
          // 如果是移动设备，滚动到顶部
          if (window.innerWidth <= 1200) {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
          }
        }
      }
    });
  }

  // 在页面加载时检查是否有目录
  const tocContent = document.getElementById('TableOfContents');
  if (tocContent && tocContent.innerHTML.trim() !== '') {
    // 如果有目录内容，确保目录切换按钮可见
    if (tocToggler) {
      tocToggler.style.display = 'flex';
    }
  } else {
    // 如果没有目录内容，隐藏目录切换按钮
    if (tocToggler) {
      tocToggler.style.display = 'none';
    }
  }
});