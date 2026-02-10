/**
 * Kimi 论文解读配置
 * promptTemplate 中的 {{pdfUrl}} 会被替换为论文 PDF 链接
 */
const KIMI_CONFIG = {
  baseUrl: 'https://www.kimi.com/_prefill_chat',

  /** 预填用户提问，{{pdfUrl}} 替换为论文 PDF 地址 */
  promptTemplate: '请你阅读这篇文章{{pdfUrl}},总结一下这篇文章解决的问题、相关工作、研究方法、做了什么实验及其结果、结论，最后整体总结一下这篇文章的内容',

  /** 系统角色设定 */
  systemPrompt: '你是一个学术助手，后面的对话将围绕着以下论文内容进行，已经通过链接给出了论文的PDF和论文已有的FAQ。用户将继续向你咨询论文的相关问题，请你作出专业的回答，不要出现第一人称，当涉及到分点回答时，鼓励你以markdown格式输出。'
};

/**
 * 根据论文对象生成 Kimi 对话链接
 * @param {{ url?: string }} paper - 论文对象，至少包含 url（如 https://arxiv.org/abs/xxx）
 * @returns {string} 完整 Kimi 预填对话 URL
 */
function buildKimiChatUrl(paper) {
  const pdfUrl = (paper.url || '').replace('abs', 'pdf');
  const prompt = KIMI_CONFIG.promptTemplate.replace(/\{\{pdfUrl\}\}/g, pdfUrl);
  const params = new URLSearchParams({
    prefill_prompt: prompt,
    system_prompt: KIMI_CONFIG.systemPrompt,
    send_immediately: 'true',
    force_search: 'true'
  });
  return `${KIMI_CONFIG.baseUrl}?${params.toString()}`;
}
