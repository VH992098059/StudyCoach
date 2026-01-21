/**
 * @fileoverview 文档检索页面
 * @description 用于在知识库中检索相关文档内容
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Form,
  Row,
  Col,
  InputNumber,
  Slider,
  Divider,
  Collapse,
  Tag,
  Empty,
  Skeleton,
  Space,
  Select,
  message,
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '../../../services/knowledgeBase';
import { RetrieverService, type RetrievalDocument } from '../../../services/retriever';
import './index.scss';

const { Panel } = Collapse;
const { Option } = Select;

/**
 * 搜索表单数据接口
 */
interface SearchForm {
  question: string;
  top_k: number;
  score: number;
  knowledge_name: string;
}

// 使用从服务中导入的接口类型
type SearchResult = RetrievalDocument;

/**
 * 文档检索页面组件
 */
const Retriever: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<RetrievalDocument[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>(['0']);
  const [searched, setSearched] = useState(false);
  const [knowledgeOptions, setKnowledgeOptions] = useState<Array<{id: string; name: string}>>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);

  /**
   * 获取知识库列表
   */
  const fetchKnowledgeList = async () => {
    setKnowledgeLoading(true);
    try {
      const response = await KnowledgeBaseService.getList({ status: KBStatus.OK });
      const options = [
        { id: '', name: t('retriever.allKb') },
        ...(response.list || []).map((kb: KnowledgeBase) => ({
          id: kb.name,
          name: kb.name
        }))
      ];
      setKnowledgeOptions(options);
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      message.error(t('retriever.validation.fetchKbFailed'));
    } finally {
      setKnowledgeLoading(false);
    }
  };

  // 组件挂载时获取知识库列表
  useEffect(() => {
    fetchKnowledgeList();
  }, []);



  /**
   * 渲染 Markdown 内容
   */
  const renderMarkdown = (content: string): string => {
    // 简单的 Markdown 渲染，实际项目中可以使用 marked 或 react-markdown
    return content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br>');
  };

  /**
   * 处理搜索
   */
  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      
      if (!values.question?.trim()) {
        message.warning(t('retriever.validation.question'));
        return;
      }

      if (!values.knowledge_name) {
        message.warning(t('retriever.validation.kb'));
        return;
      }

      setLoading(true);
      setSearched(true);

      // 调用真实API
      const response = await RetrieverService.retrieve({
        question: values.question,
        top_k: values.top_k || 5,
        score: values.score || 0.2,
        knowledge_name: values.knowledge_name
      });

      const results = response.document || [];
      setSearchResults(results);
      setActiveKeys(results.length > 0 ? ['0'] : []);

      if (results.length === 0) {
        message.info(t('retriever.noResult'));
      } else {
        message.success(t('retriever.found', { count: results.length }));
      }

    } catch (error) {
      console.error('Search error:', error);
      message.error(t('retriever.validation.failed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理回车搜索
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * 格式化相似度分数
   */
  const formatScore = (score: number): string => {
    return (score * 100).toFixed(1) + '%';
  };

  return (
    <div className="retriever-container">
      <Card className="retriever-card">
        <div className="card-header">
          <Space>
            <SearchOutlined className="header-icon" />
            <span className="header-title">{t('retriever.title')}</span>
          </Space>

        </div>

        <Divider />

        <div className="search-area">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              question: '',
              top_k: 5,
              score: 0.2,
              knowledge_name: undefined
            }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={16}>
                <Form.Item name="question">
                  <Input.Search
                    placeholder={t('retriever.placeholder')}
                    size="large"
                    enterButton={
                      <Button type="primary" icon={<SearchOutlined />}>
                        {t('retriever.search')}
                      </Button>
                    }
                    onSearch={handleSearch}
                    onKeyDown={handleKeyPress}
                    loading={loading}
                  />
                </Form.Item>
              </Col>
              <Col xs={35} sm={9}>
                <Form.Item name="knowledge_name" >
                  <Select
                    placeholder={t('retriever.selectKb')}
                    loading={knowledgeLoading}
                    allowClear
                  >
                    {knowledgeOptions
                      .filter(option => option.id !== '') // 过滤掉"全部知识库"选项
                      .map(option => (
                        <Option key={option.id} value={option.id}>
                          {option.name}
                        </Option>
                      ))
                    }
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item label={t('retriever.topK')} name="top_k">
                  <InputNumber
                    min={1}
                    max={10}
                    style={{ width: '100%' }}
                    controls
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={t('retriever.score')} name="score">
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    tooltip={{
                      formatter: (value) => `${(value! * 100).toFixed(0)}%`
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>

        {loading && (
          <div className="loading-area">
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <div className="result-area">
            <Divider >
              <Space>
                <FileTextOutlined />
                <span>{t('retriever.result')}</span>
              </Space>
            </Divider>

            <Collapse
              activeKey={activeKeys}
              onChange={setActiveKeys}
              ghost
            >
              {searchResults.map((result, index) => (
                <Panel
                  header={
                    <div className="result-header">
                      <Space>
                        <span className="result-title">
                          {t('retriever.fragment')} #{index + 1}
                        </span>
                        <Tag color="blue">
                          {t('retriever.similarity')}: {formatScore(result.meta_data._score)}
                        </Tag>
                        <Tag color="green">
                          {result.meta_data.ext._file_name || t('retriever.unknownSource')}
                        </Tag>
                      </Space>
                    </div>
                  }
                  key={index.toString()}
                >
                  <Card className="content-card" size="small">
                    <div className="source-info">
                      <Tag  color="processing">
                        {result.meta_data.ext._file_name || t('retriever.unknownSource')}
                      </Tag>
                    </div>
                    <div 
                      className="content-text markdown-content"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(result.content)
                      }}
                    />
                  </Card>
                </Panel>
              ))}
            </Collapse>
          </div>
        )}

        {!loading && searchResults.length === 0 && searched && (
          <div className="empty-result">
            <Empty 
              description={t('retriever.noResult')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Retriever;