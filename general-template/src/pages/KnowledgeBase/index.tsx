import React, { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  message, 
  Modal, 
  Form, 
  Input, 
  Radio,
  Empty,
  Spin,
  Popconfirm
} from 'antd';
import { 
  FolderOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '../../services/knowledgeBase';

const { Title } = Typography;
const { TextArea } = Input;

const KnowledgeBase: React.FC = () => {
  const [knowledgeBaseList, setKnowledgeBaseList] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [form] = Form.useForm();

  // 表单数据
  const [kbForm, setKbForm] = useState<KnowledgeBase>({
    id: 0,
    name: '',
    description: '',
    category: '',
    status: KBStatus.OK
  });

  // 表单验证规则
  const rules = {
    name: [
      { required: true, message: '请输入知识库名称' },
      { min: 3, max: 20, message: '长度在 3 到 20 个字符' }
    ],
    description: [
      { required: true, message: '请输入知识库描述' },
      { min: 3, max: 200, message: '长度在 3 到 200 个字符' }
    ],
    category: [
      { min: 3, max: 10, message: '长度在 3 到 10 个字符' }
    ]
  };

  // 页面加载时获取知识库列表
  useEffect(() => {
    fetchKnowledgeBaseList();
  }, []);

  // 获取知识库列表
  const fetchKnowledgeBaseList = async () => {
    setLoading(true);
    try {
      const response = await KnowledgeBaseService.getList();
      setKnowledgeBaseList(response.list || []);
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      message.error('获取知识库列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 显示新建对话框
  const showAddDialog = () => {
    setIsEdit(false);
    resetForm();
    setDialogVisible(true);
  };

  // 显示编辑对话框
  const showEditDialog = (record: KnowledgeBase) => {
    setIsEdit(true);
    resetForm();
    setKbForm({ ...record });
    form.setFieldsValue(record);
    setDialogVisible(true);
  };

  // 重置表单
  const resetForm = () => {
    setKbForm({
      id: 0,
      name: '',
      description: '',
      category: '',
      status: KBStatus.OK
    });
    form.resetFields();
  };

  // 提交表单
  const submitForm = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      if (isEdit) {
        // 编辑知识库
        await KnowledgeBaseService.update({
          id: kbForm.id,
          ...values
        });
        message.success('知识库更新成功');
      } else {
        // 创建知识库
        await KnowledgeBaseService.create(values);
        message.success('知识库创建成功');
      }
      
      setDialogVisible(false);
      resetForm();
      // 重新获取列表
      await fetchKnowledgeBaseList();
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 确认删除
  const confirmDelete = async (record: KnowledgeBase) => {
    try {
      await KnowledgeBaseService.delete(record.id);
      message.success('知识库删除成功');
      // 重新获取列表
      await fetchKnowledgeBaseList();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 表格列配置
  const columns: ColumnsType<KnowledgeBase> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '知识库名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: KBStatus) => (
        <Tag color={status === KBStatus.OK ? 'success' : 'error'}>
          {status === KBStatus.OK ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            size="small" 
            type="primary" 
            ghost
            icon={<EditOutlined />}
            onClick={() => showEditDialog(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个知识库吗？"
            description="此操作不可恢复。"
            onConfirm={() => confirmDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              size="small" 
              type="primary" 
              danger
              ghost
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ margin: '10px' }}>
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FolderOutlined style={{ marginRight: '8px', fontSize: '18px' }} />
            <Title level={4} style={{ margin: 0 }}>知识库管理</Title>
          </div>
          <Button 
            type="primary" 
            size="small" 
            icon={<PlusOutlined />}
            onClick={showAddDialog}
          >
            新建知识库
          </Button>
        </div>
        
        {/* 知识库列表 */}
        <div style={{ marginTop: '20px' }}>
          <Table
            loading={loading}
            dataSource={knowledgeBaseList}
            columns={columns}
            rowKey="id"
            bordered
            locale={{
              emptyText: (
                <Empty 
                  image={<FolderOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
                  description="暂无知识库，请点击右上角新建"
                />
              )
            }}
          />
        </div>
      </Card>
      
      {/* 新建/编辑知识库对话框 */}
      <Modal
        title={isEdit ? '编辑知识库' : '新建知识库'}
        open={dialogVisible}
        onCancel={() => {
          setDialogVisible(false);
          resetForm();
        }}
        footer={[
          <Button key="cancel" onClick={() => setDialogVisible(false)}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={submitting}
            onClick={submitForm}
          >
            确认
          </Button>
        ]}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={kbForm}
        >
          <Form.Item
            label="知识库名称"
            name="name"
            rules={rules.name}
          >
            <Input placeholder="请输入知识库名称" />
          </Form.Item>
          
          <Form.Item
            label="描述"
            name="description"
            rules={rules.description}
          >
            <TextArea 
              rows={3} 
              placeholder="请输入知识库描述" 
            />
          </Form.Item>
          
          <Form.Item
            label="分类"
            name="category"
            rules={rules.category}
          >
            <Input placeholder="请输入知识库分类" />
          </Form.Item>
          
          {isEdit && (
            <Form.Item
              label="状态"
              name="status"
            >
              <Radio.Group>
                <Radio value={KBStatus.OK}>启用</Radio>
                <Radio value={KBStatus.DISABLED}>禁用</Radio>
              </Radio.Group>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeBase;