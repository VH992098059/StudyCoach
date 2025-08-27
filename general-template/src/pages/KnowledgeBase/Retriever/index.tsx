/**
 * @fileoverview 文档检索页面
 * @description 用于在知识库中检索相关文档内容
 * @author 开发团队
 * @version 1.0.0
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
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '../../../services/knowledgeBase';
import './index.css';

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

/**
 * 检索结果接口
 */
interface SearchResult {
  content: string;
  meta_data: {
    _score: number;
    ext: {
      _file_name: string;
    };
  };
}

/**
 * 文档检索页面组件
 */
const Retriever: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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
        { id: '', name: '全部知识库' },
        ...(response.list || []).map((kb: KnowledgeBase) => ({
          id: kb.name,
          name: kb.name
        }))
      ];
      setKnowledgeOptions(options);
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      message.error('获取知识库列表失败');
    } finally {
      setKnowledgeLoading(false);
    }
  };

  // 组件挂载时获取知识库列表
  useEffect(() => {
    fetchKnowledgeList();
  }, []);

  // 模拟检索结果
  const mockResults: SearchResult[] = [
    {
      content: `# React 组件开发最佳实践

React 是一个用于构建用户界面的 JavaScript 库。在开发 React 组件时，我们需要遵循一些最佳实践：

## 1. 组件设计原则
- **单一职责原则**：每个组件应该只负责一个功能
- **可复用性**：设计组件时要考虑复用性
- **可维护性**：代码要清晰易懂，便于维护

## 2. 状态管理
使用 useState 和 useEffect 钩子来管理组件状态和副作用。

\`\`\`javascript
const [count, setCount] = useState(0);

useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\``,
      meta_data: {
        _score: 0.95,
        ext: {
          _file_name: 'React开发指南.pdf'
        }
      }
    },
    {
      content: `## 组件生命周期

React 函数组件通过 useEffect 钩子来处理生命周期：

### 组件挂载
\`\`\`javascript
useEffect(() => {
  // 组件挂载后执行
  console.log('Component mounted');
  
  return () => {
    // 组件卸载前执行
    console.log('Component will unmount');
  };
}, []); // 空依赖数组表示只在挂载和卸载时执行
\`\`\`

### 状态更新
当依赖项发生变化时，useEffect 会重新执行。`,
      meta_data: {
        _score: 0.87,
        ext: {
          _file_name: 'React开发指南.pdf'
        }
      }
    },
    {
      content: `# 项目架构设计

在大型 React 项目中，良好的架构设计至关重要：

## 目录结构
\`\`\`
src/
  components/     # 通用组件
  pages/         # 页面组件
  hooks/         # 自定义钩子
  utils/         # 工具函数
  services/      # API 服务
  types/         # TypeScript 类型定义
\`\`\`

## 状态管理
对于复杂的状态管理，推荐使用 Redux Toolkit 或 Zustand。`,
      meta_data: {
        _score: 0.72,
        ext: {
          _file_name: '项目架构文档.md'
        }
      }
    }
  ];

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
        message.warning('请输入搜索问题');
        return;
      }

      setLoading(true);
      setSearched(true);

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 根据搜索内容过滤结果
      const filteredResults = mockResults.filter(result => 
        result.content.toLowerCase().includes(values.question.toLowerCase()) ||
        values.question.toLowerCase().includes('react') ||
        values.question.toLowerCase().includes('组件')
      );

      setSearchResults(filteredResults);
      setActiveKeys(filteredResults.length > 0 ? ['0'] : []);

      if (filteredResults.length === 0) {
        message.info('未找到相关文档');
      } else {
        message.success(`找到 ${filteredResults.length} 个相关结果`);
      }

    } catch (error) {
      console.error('Search error:', error);
      message.error('检索失败，请重试');
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
            <span className="header-title">文档检索</span>
          </Space>
          <div className="header-actions">
            <Space>
              <span>选择知识库:</span>
              <Select
                defaultValue=""
                style={{ width: 200 }}
                placeholder="请选择知识库"
                loading={knowledgeLoading}
              >
                {knowledgeOptions.map(option => (
                  <Option key={option.id} value={option.id}>
                    {option.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </div>
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
              knowledge_name: ''
            }}
          >
            <Form.Item name="question">
              <Input.Search
                placeholder="请输入您想要检索的问题"
                size="large"
                enterButton={
                  <Button type="primary" icon={<SearchOutlined />}>
                    检索
                  </Button>
                }
                onSearch={handleSearch}
                onKeyDown={handleKeyPress}
                loading={loading}
              />
            </Form.Item>

            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item label="返回结果数量" name="top_k">
                  <InputNumber
                    min={1}
                    max={10}
                    style={{ width: '100%' }}
                    controls
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="相似度阈值" name="score">
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
            <Divider orientation="left">
              <Space>
                <FileTextOutlined />
                <span>检索结果</span>
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
                          文档片段 #{index + 1}
                        </span>
                        <Tag color="blue">
                          相似度: {formatScore(result.meta_data._score)}
                        </Tag>
                        <Tag color="green">
                          {result.meta_data.ext._file_name || '未知来源'}
                        </Tag>
                      </Space>
                    </div>
                  }
                  key={index.toString()}
                >
                  <Card className="content-card" size="small">
                    <div className="source-info">
                      <Tag  color="processing">
                        {result.meta_data.ext._file_name || '未知来源'}
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
              description="未找到相关文档"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Retriever;