/**
 * @fileoverview 文档索引页面
 * @description 用于上传和索引文档到知识库的页面
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Upload,
  Button,
  Alert,
  Descriptions,
  Tag,
  Divider,
  Select,
  message,
  Space,
  Tabs,
  Input,
  Form,
  Empty,
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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      message.error(t('kb.error.fetch'));
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
      message.error(t('indexer.validation.fileType'));
      return false;
    }

    // 检查文件大小 (10MB)
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error(t('indexer.validation.fileSize'));
      return false;
    }

    // 显示处理中信息
    setProcessingInfo({
      title: t('indexer.processInfo.processing'),
      type: 'info',
      description: t('indexer.processInfo.processingDesc', { fileName: file.name }),
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
      message.warning(t('indexer.validation.selectFile'));
      return;
    }

    if (!selectedKnowledge) {
      message.warning(t('indexer.validation.selectKb'));
      return;
    }

    if (knowledgeList.length === 0) {
      message.warning(t('indexer.validation.noKb'));
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj as File);
      formData.append('knowledge_name', selectedKnowledge);

      const result = await ApiClient.post('/gateway/v1/indexer', formData);

      setProcessingInfo({
        title: t('indexer.processInfo.success'),
        type: 'success',
        description: t('indexer.processInfo.successDesc')
      });

      setIndexResult({
        chunks: result.doc_ids?.length || 0,
        status: 'success',
        fileName: fileList[0]?.name
      });

      message.success(t('indexer.validation.indexSuccess'));
      setFileList([]);
      
    } catch (error) {
      console.error('Upload error details:', error);
      
      let errorMessage = t('indexer.validation.indexError');
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `${t('common.error')}: ${(error as any).message}`;
        } else if ('code' in error) {
          errorMessage = `${t('common.error')}: ${(error as any).code}`;
        }
      }
      
      setProcessingInfo({
        title: t('indexer.processInfo.fail'),
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
      message.warning(t('indexer.validation.invalidUrl'));
      return;
    }

    if (!selectedKnowledge) {
      message.warning(t('indexer.validation.selectKb'));
      return;
    }

    if (knowledgeList.length === 0) {
      message.warning(t('indexer.validation.noKb'));
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('url', urlValue);
      formData.append('knowledge_name', selectedKnowledge);

      const result = await ApiClient.post('/gateway/v1/indexer', formData);
      setProcessingInfo({
        title: t('indexer.processInfo.urlProcessing'),
        type: 'success',
        description: t('indexer.processInfo.urlSuccessDesc')
      });

      setIndexResult({
        chunks: result.doc_ids?.length || 0,
        status: 'success',
        fileName: urlValue
      });
      
      
      message.success(t('indexer.validation.urlSuccess'));
      setUrlValue('');
      urlForm.resetFields();
      
    } catch (error) {
      console.error('URL index error details:', error);
      
      let errorMessage = t('indexer.validation.urlError');
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `${t('common.error')}: ${(error as any).message}`;
        } else if ('code' in error) {
          errorMessage = `${t('common.error')}: ${(error as any).code}`;
        }
      }
      
      setProcessingInfo({
        title: t('indexer.processInfo.urlFail'),
        type: 'error',
        description: errorMessage,
      });

      setIndexResult({
        chunks: 0,
        status: 'error',
        fileName: urlValue
      });

      message.error(`${t('indexer.validation.urlError')}${errorMessage}`);
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
      return Promise.reject(new Error(t('indexer.validation.enterUrl')));
    }
    try {
      const u = new URL(value.trim());
      if (!['http:', 'https:'].includes(u.protocol)) {
        return Promise.reject(new Error(t('indexer.validation.urlProtocol')));
      }
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error(t('indexer.validation.invalidUrl')));
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
            <span className="header-title">{t('indexer.title')}</span>
          </Space>
          <div className="header-actions">
            <Space>
              <span>{t('indexer.selectKb')}:</span>
              <Select
                value={selectedKnowledge}
                onChange={setSelectedKnowledge}
                style={{ width: 200 }}
                placeholder={knowledgeLoading ? t('common.loading') : t('indexer.selectKbPlaceholder')}
                loading={knowledgeLoading}
                disabled={knowledgeList.length === 0}
                notFoundContent={
                  knowledgeList.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span>
                          {t('indexer.noKb')}<br/>
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={() => {
                              message.info(t('indexer.createKbTip'));
                              // 可以在这里添加路由跳转逻辑
                              // navigate('/knowledge-base');
                            }}
                          >
                            {t('indexer.createKb')}
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
            message={t('indexer.noKb')}
            description={
              <span>
                {t('indexer.createKbTip')}
                <Button 
                  type="link" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    message.info(t('indexer.createKbTip'));
                    // 可以在这里添加路由跳转逻辑
                    // navigate('/knowledge-base');
                  }}
                >
                  {t('indexer.goCreate')}
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
                  {t('indexer.fileUpload')}
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
                    {t('indexer.dragTip')} <em>{t('indexer.clickSelect')}</em>
                  </p>
                  <p className="ant-upload-hint">
                    {t('indexer.uploadHint')}
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
                      {uploading ? t('indexer.indexing') : t('indexer.startIndex')}
                    </Button>
                  </div>
                )}
              </div>
            </TabPane>
            
            <TabPane
              tab={
                <span>
                  <LinkOutlined />
                  {t('indexer.urlIndex')}
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
                    label={t('indexer.urlLabel')}
                    name="url"
                    rules={[{ validator: validateUrl }]}
                    validateTrigger={["onBlur"]}
                  >
                    <Input
                      placeholder={t('indexer.urlPlaceholder')}
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
                      {uploading ? t('indexer.indexing') : t('indexer.startIndex')}
                    </Button>
                  </div>
                </Form>
                
                <div className="url-tips">
                  <Alert
                    message={t('indexer.urlTipTitle')}
                    description={t('indexer.urlTipDesc')}
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
              <span className="header-title">{t('indexer.result.title')}</span>
            </Space>
          </div>
          
          <Divider />
          
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t('indexer.result.fileName')}>
              <Space>
                <FileTextOutlined />
                {indexResult.fileName || t('indexer.result.unknownFile')}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('indexer.result.chunks')}>
              {indexResult.chunks}
            </Descriptions.Item>
            <Descriptions.Item label={t('indexer.result.status')}>
              <Tag color={indexResult.status === 'success' ? 'success' : 'error'}>
                {indexResult.status === 'success' ? t('indexer.result.success') : t('indexer.result.fail')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('indexer.result.kb')}>
              {knowledgeList.find(k => k.name === selectedKnowledge)?.name || selectedKnowledge || t('indexer.result.unknown')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default Indexer;
