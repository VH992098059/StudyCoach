/**
 * @fileoverview 文档索引页面
 * @description 用于上传和索引文档到知识库的页面
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Upload,
  Button,
  Alert,
  Descriptions,
  Tag,
  Divider,
  InputNumber,
  Row,
  Col,
  Select,
  message,
  Space,
  Tabs,
  Input,
  Form,
  Empty,
  Spin,
} from 'antd';
import {
  UploadOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  LinkOutlined,
  CloudUploadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';
import ApiClient from '@/utils/axios/index';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '@/services/knowledgeBase';
import './index.scss';


const { Dragger } = Upload;
const { Option } = Select;
const { TabPane } = Tabs;

/**
 * 处理信息接口
 */
interface ProcessingInfo {
  title: string;
  type: 'info' | 'success' | 'error' | 'warning';
  description: string;
}

/**
 * 索引结果接口
 */
interface IndexResult {
  chunks: number;
  status: 'success' | 'error';
  fileName?: string;
}

/**
 * 文档索引页面组件
 */
const Indexer: React.FC = () => {
  const [processingInfo, setProcessingInfo] = useState<ProcessingInfo | null>(null);
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string>('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('file');
  const [urlForm] = Form.useForm();
  const [urlValue, setUrlValue] = useState<string>('');
  
  // 知识库列表相关状态
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeBase[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState<boolean>(false);

  /**
   * 获取知识库列表
   */
  const fetchKnowledgeList = async () => {
    setKnowledgeLoading(true);
    try {
      const response = await KnowledgeBaseService.getList({ status: KBStatus.OK });
      setKnowledgeList(response.list || []);
      // 如果有知识库且当前没有选中，自动选择第一个
      if (response.list && response.list.length > 0 && !selectedKnowledge) {
        setSelectedKnowledge(response.list[0].name);
      }
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      message.error('获取知识库列表失败');
    } finally {
      setKnowledgeLoading(false);
    }
  };

  // 页面加载时获取知识库列表
  useEffect(() => {
    fetchKnowledgeList();
  }, []);

  /**
   * 文件上传前的检查
   */
  const beforeUpload = (file: File): boolean => {
    // 检查文件类型
    const allowedTypes = [
      'text/markdown',
      'text/html', 
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const isAllowed = allowedTypes.includes(file.type) || 
                     file.name.endsWith('.md') || 
                     file.name.endsWith('.txt') ||
                     file.name.endsWith('.html');

    if (!isAllowed) {
      message.error('只支持 Markdown、HTML、文本文件、PDF 和 Word 文档!');
      return false;
    }

    // 检查文件大小 (10MB)
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('文件大小不能超过 10MB!');
      return false;
    }

    // 显示处理中信息
    setProcessingInfo({
      title: '文档处理中',
      type: 'info',
      description: `正在处理文件: ${file.name}，请稍候...`,
    });

    return false; // 阻止自动上传，手动控制
  };

  /**
   * 文件列表变化处理
   */
  const handleChange: UploadProps['onChange'] = (info) => {
    setFileList(info.fileList);
  };

  /**
   * 手动上传处理
   */
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择要上传的文件');
      return;
    }

    if (!selectedKnowledge) {
      message.warning('请先选择知识库');
      return;
    }

    if (knowledgeList.length === 0) {
      message.warning('暂无可用知识库，请先创建知识库');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj as File);
      formData.append('knowledge_name', selectedKnowledge);

      const result = await ApiClient.post('/gateway/v1/indexer', formData);

      setProcessingInfo({
        title: '文档处理完成',
        type: 'success',
        description: '文档已成功索引到系统中'
      });

      setIndexResult({
        chunks: result.doc_ids?.length || 0,
        status: 'success',
        fileName: fileList[0]?.name
      });

      message.success('文档索引成功!');
      setFileList([]);
      
    } catch (error) {
      console.error('Upload error details:', error);
      
      let errorMessage = '文档索引过程中发生错误，请重试';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `错误信息: ${error.message}`;
        } else if ('code' in error) {
          errorMessage = `错误代码: ${error.code}`;
        }
      }
      
      setProcessingInfo({
        title: '文档处理失败',
        type: 'error',
        description: errorMessage,
      });

      setIndexResult({
        chunks: 0,
        status: 'error',
        fileName: fileList[0]?.name
      });

      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  /**
   * URL索引处理
   */
  const handleUrlIndex = async () => {
    try {
      await urlForm.validateFields();
    } catch {
      return;
    }

    if (!urlValue.trim()) {
      message.warning('请输入有效的URL地址');
      return;
    }

    if (!selectedKnowledge) {
      message.warning('请先选择知识库');
      return;
    }

    if (knowledgeList.length === 0) {
      message.warning('暂无可用知识库，请先创建知识库');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('url', urlValue);
      formData.append('knowledge_name', selectedKnowledge);

      const result = await ApiClient.post('/gateway/v1/indexer', formData);
      setProcessingInfo({
        title: 'URL处理完成',
        type: 'success',
        description: 'URL内容已成功索引到系统中'
      });

      setIndexResult({
        chunks: result.doc_ids?.length || 0,
        status: 'success',
        fileName: urlValue
      });
      
      
      message.success('URL索引成功!');
      setUrlValue('');
      urlForm.resetFields();
      
    } catch (error) {
      console.error('URL index error details:', error);
      
      let errorMessage = 'URL索引过程中发生错误，请重试';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `错误信息: ${error.message}`;
        } else if ('code' in error) {
          errorMessage = `错误代码: ${error.code}`;
        }
      }
      
      setProcessingInfo({
        title: 'URL处理失败',
        type: 'error',
        description: errorMessage,
      });

      setIndexResult({
        chunks: 0,
        status: 'error',
        fileName: urlValue
      });

      message.error(`URL索引失败: ${errorMessage}`);
      console.error('URL index error:', error);
    } finally {
      setUploading(false);
    }
  };

  /**
   * URL验证规则
   */
  const validateUrl = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请输入URL地址'));
    }
    try {
      const u = new URL(value.trim());
      if (!['http:', 'https:'].includes(u.protocol)) {
        return Promise.reject(new Error('只支持 http/https 协议'));
      }
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error('请输入有效的URL地址'));
    }
  };

  /**
   * 移除文件
   */
  const handleRemove = (file: UploadFile) => {
    const index = fileList.indexOf(file);
    const newFileList = fileList.slice();
    newFileList.splice(index, 1);
    setFileList(newFileList);
  };

  return (
    <div className="indexer-container">
      <Card className="indexer-card">
        <div className="card-header">
          <Space>
            <UploadOutlined className="header-icon" />
            <span className="header-title">文档索引</span>
          </Space>
          <div className="header-actions">
            <Space>
              <span>选择知识库:</span>
              <Select
                value={selectedKnowledge}
                onChange={setSelectedKnowledge}
                style={{ width: 200 }}
                placeholder={knowledgeLoading ? "加载中..." : "请选择知识库"}
                loading={knowledgeLoading}
                disabled={knowledgeList.length === 0}
                notFoundContent={
                  knowledgeList.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span>
                          暂无可用知识库<br/>
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={() => {
                              message.info('请先到知识库管理页面创建知识库');
                              // 可以在这里添加路由跳转逻辑
                              // navigate('/knowledge-base');
                            }}
                          >
                            创建知识库
                          </Button>
                        </span>
                      }
                    />
                  ) : null
                }
              >
                {knowledgeList.map(kb => (
                  <Option key={kb.id} value={kb.name}>
                    {kb.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </div>
        </div>

        <Divider />

        {knowledgeList.length === 0 && !knowledgeLoading && (
          <Alert
            message="暂无可用知识库"
            description={
              <span>
                请先到知识库管理页面创建知识库，然后再进行文档索引。
                <Button 
                  type="link" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    message.info('请先到知识库管理页面创建知识库');
                    // 可以在这里添加路由跳转逻辑
                    // navigate('/knowledge-base');
                  }}
                >
                  前往创建
                </Button>
              </span>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div className="indexer-tabs">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <span>
                  <CloudUploadOutlined />
                  文件上传
                </span>
              }
              key="file"
            >
              <div className="upload-area">
                <Dragger
                  fileList={fileList}
                  beforeUpload={beforeUpload}
                  onChange={handleChange}
                  onRemove={handleRemove}
                  multiple
                  showUploadList={{
                    showPreviewIcon: false,
                    showRemoveIcon: true,
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    拖拽文件到此处或 <em>点击选择文件</em>
                  </p>
                  <p className="ant-upload-hint">
                    支持上传 PDF、Markdown、HTML、Word 等文档文件，单个文件不超过 10MB
                  </p>
                </Dragger>

                {fileList.length > 0 && (
                  <div className="upload-actions">
                    <Button
                      type="primary"
                      onClick={handleUpload}
                      loading={uploading}
                      disabled={knowledgeList.length === 0 || !selectedKnowledge}
                      icon={<UploadOutlined />}
                    >
                      {uploading ? '索引中...' : '开始索引'}
                    </Button>
                  </div>
                )}
              </div>
            </TabPane>
            
            <TabPane
              tab={
                <span>
                  <LinkOutlined />
                  URL链接
                </span>
              }
              key="url"
            >
              <div className="url-area">
                <Form
                  form={urlForm}
                  layout="vertical"
                  onFinish={handleUrlIndex}
                >
                  <Form.Item
                    label="URL地址"
                    name="url"
                    rules={[{ validator: validateUrl }]}
                    validateTrigger={["onBlur"]}
                  >
                    <Input
                      placeholder="请输入要索引的网页URL，如：https://example.com/article"
                      value={urlValue}
                      onChange={(e) => setUrlValue(e.target.value)}
                      prefix={<LinkOutlined />}
                      size="large"
                    />
                  </Form.Item>
                  
                  <div className="url-actions">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={uploading}
                      icon={<UploadOutlined />}
                      size="large"
                      disabled={!urlValue.trim() || knowledgeList.length === 0 || !selectedKnowledge}
                    >
                      {uploading ? '索引中...' : '开始索引'}
                    </Button>
                  </div>
                </Form>
                
                <div className="url-tips">
                  <Alert
                    message="URL索引说明"
                    description="系统将自动抓取网页内容并进行索引，支持大部分公开网页。请确保URL可以正常访问。"
                    type="info"
                    showIcon
                    closable={false}
                  />
                </div>
              </div>
            </TabPane>
          </Tabs>
        </div>

        {processingInfo && (
          <div className="process-info">
            <Alert
              message={processingInfo.title}
              description={processingInfo.description}
              type={processingInfo.type}
              showIcon
              closable={false}
            />
          </div>
        )}
      </Card>

      {indexResult && (
        <Card className="indexer-info-card">
          <div className="card-header">
            <Space>
              <InfoCircleOutlined className="header-icon" />
              <span className="header-title">索引结果</span>
            </Space>
          </div>
          
          <Divider />
          
          <Descriptions column={1} bordered>
            <Descriptions.Item label="文件名">
              <Space>
                <FileTextOutlined />
                {indexResult.fileName || '未知文件'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="文档片段数">
              {indexResult.chunks}
            </Descriptions.Item>
            <Descriptions.Item label="索引状态">
              <Tag color={indexResult.status === 'success' ? 'success' : 'error'}>
                {indexResult.status === 'success' ? '成功' : '失败'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="知识库">
              {knowledgeList.find(k => k.name === selectedKnowledge)?.name || selectedKnowledge || '未知'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default Indexer;
