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

  // 数学公式优化
  // 监听MathJax渲染完成事件
  if (typeof MathJax !== 'undefined') {
    MathJax.startup.promise.then(() => {
      // 为长数学公式添加滚动功能
      const mathDisplays = document.querySelectorAll('.MathJax_Display');
      mathDisplays.forEach(display => {
        if (display.scrollWidth > display.clientWidth) {
          display.style.overflowX = 'auto';
        }
      });
    });
  }

  // 处理页面主题切换时的数学公式重新渲染
  const themeToggler = document.querySelector('[data-theme-toggle]');
  if (themeToggler) {
    themeToggler.addEventListener('click', function() {
      // 延迟一点时间让主题切换完成
      setTimeout(() => {
        if (typeof MathJax !== 'undefined') {
          MathJax.typesetPromise().then(() => {
            console.log('数学公式已重新渲染');
          });
        }
      }, 100);
    });
  }

  // PDF导出功能
  const exportPdfBtn = document.getElementById('export-pdf-btn');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', function() {
      exportToPDF();
    });
  }
});

// PDF导出函数
async function exportToPDF() {
  // 显示加载提示
  const exportBtn = document.getElementById('export-pdf-btn');
  const originalContent = exportBtn.innerHTML;
  exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  exportBtn.disabled = true;

  try {
    // 等待jsPDF和html2canvas库加载
    if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
      alert('PDF导出功能正在加载中，请稍后再试...');
      return;
    }

    // 获取文章内容区域
    const articleContent = document.querySelector('.post-content');
    
    // 优先获取文章内容中的主标题
    let articleTitle = '';
    const contentH1 = document.querySelector('#post-content h1, .post-content h1');
    if (contentH1) {
      articleTitle = contentH1.textContent;
    } else {
      // 如果文章内容中没有h1，则尝试其他位置的标题
      const titleElement = document.querySelector('.title h1, h1, .post-title, .article-title');
      articleTitle = titleElement ? titleElement.textContent : document.title;
    }
    
    if (!articleContent) {
      alert('未找到文章内容');
      return;
    }

    // 创建PDF文档
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // 设置字体（支持中文）
    pdf.setFont('Arial', 'normal');
    
    // 创建一个临时容器用于渲染
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20px';
    tempContainer.innerHTML = articleContent.innerHTML;
    
    // 移除PDF中不需要的元素
    const elementsToRemove = tempContainer.querySelectorAll('.svg-pan-zoom-controls, svg-pan-zoom-controls, [class*="svg-pan-zoom-control"], [class*="pan-zoom-control"]');
    elementsToRemove.forEach(element => {
      element.remove();
    });
    
    document.body.appendChild(tempContainer);

    // 使用html2canvas转换为图片
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794,
      scrollX: 0,
      scrollY: 0
    });

    // 移除临时容器
    document.body.removeChild(tempContainer);

    // 将canvas转换为图片并添加到PDF
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 170; // PDF中的图片宽度(mm)
    const pageHeight = 297; // A4高度(mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 30; // 标题下方位置

    // 添加图片到PDF（如果内容超过一页，则分页）
    pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - position);

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 30;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 生成文件名
    const fileName = generatePDFFileName(articleTitle);
    
    // 下载PDF
    pdf.save(fileName);

  } catch (error) {
    console.error('PDF导出失败:', error);
    alert('PDF导出失败，请重试');
  } finally {
    // 恢复按钮状态
    exportBtn.innerHTML = originalContent;
    exportBtn.disabled = false;
  }
}

// 生成优化的PDF文件名
function generatePDFFileName(articleTitle) {
  // 获取当前日期
  const now = new Date();
  const dateStr = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
  
  // 处理文章标题
  let cleanTitle = '';
  if (articleTitle && articleTitle.trim()) {
    // 清理标题：移除HTML标签、特殊字符等
    cleanTitle = articleTitle
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/&[a-zA-Z0-9#]+;/g, '') // 移除HTML实体
      .replace(/[<>:"/\\|?*]/g, '') // 移除文件名不允许的字符
      .replace(/[，。！？；：""''（）【】]/g, '') // 移除中文标点
      .replace(/[,\.!\?;:"'()\[\]]/g, '') // 移除英文标点
      .replace(/[-—–]/g, '-') // 统一各种连字符
      .replace(/\s+/g, '-') // 将空格替换为连字符
      .replace(/-+/g, '-') // 合并多个连字符
      .replace(/^-+|-+$/g, '') // 移除开头和结尾的连字符
      .substring(0, 60); // 适当增加长度限制到60个字符
  }
  
  // 如果清理后的标题为空，使用默认名称
  if (!cleanTitle) {
    cleanTitle = 'article';
  }
  
  // 简化文件名格式：日期-文章标题.pdf （去掉站点名以保持简洁）
  return `${dateStr}-${cleanTitle}.pdf`;
}