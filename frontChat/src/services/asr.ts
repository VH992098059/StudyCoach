/**
 * @fileoverview ASR 语音相关工具
 * @description 提供 Blob 转 Base64 等基础能力，供 MicRecorderButton 等组件使用
 */

/**
 * 将 Blob 转为 dataURI(Base64)
 */
export const blobToDataURI = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('无法转换为Base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
