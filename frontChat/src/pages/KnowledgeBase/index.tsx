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
  Popconfirm,
  Drawer,
} from 'antd';
import {
  FolderOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '../../services/knowledgeBase';
import './index.scss';
import Documents from './Documents';

const { Title } = Typography;
const { TextArea } = Input;

const KnowledgeBase: React.FC = () => {
  const { t } = useTranslation();
  const [knowledgeBaseList, setKnowledgeBaseList] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [form] = Form.useForm();

  // 文档 Drawer 状态
  const [documentsDrawerVisible, setDocumentsDrawerVisible] = useState(false);
  const [selectedKbForDocuments, setSelectedKbForDocuments] = useState<string>('');

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
      { required: true, message: t('kb.validation.nameRequired') },
      { min: 3, max: 20, message: t('kb.validation.nameLength') }
    ],
    description: [
      { required: true, message: t('kb.validation.descRequired') },
      { min: 3, max: 200, message: t('kb.validation.descLength') }
    ],
    category: [
      { min: 3, max: 10, message: t('kb.validation.categoryLength') }
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
      message.error(t('kb.error.fetch'));
    } finally {
      setLoading(false);
    }
  };

  // 显示新建对话框
  const showAddDialog = () => {
    setIsEdit(false);
    // 重置并确保表单字段全部清空
    resetForm();
    form.setFieldsValue({
      name: '',
      description: '',
      category: '',
      isNetwork: undefined,
    });
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
      
      // 如果分类为空，默认为"无分类"
      if (!values.category || !values.category.trim()) {
        values.category = t('kb.noCategory');
      }

      setSubmitting(true);

      if (isEdit) {
        // 编辑知识库
        await KnowledgeBaseService.update({
          id: kbForm.id,
          ...values
        });
        message.success(t('kb.success.update'));
      } else {
        // 创建知识库
        await KnowledgeBaseService.create(values);
        message.success(t('kb.success.create'));
      }

      setDialogVisible(false);
      resetForm();
      // 重新获取列表
      await fetchKnowledgeBaseList();
    } catch (error) {
      console.error('操作失败:', error);
      message.error(t('kb.error.operate'));
    } finally {
      setSubmitting(false);
    }
  };

  // 确认删除
  const confirmDelete = async (record: KnowledgeBase) => {
    try {
      await KnowledgeBaseService.delete(record.id);
      message.success(t('kb.success.delete'));
      // 重新获取列表
      await fetchKnowledgeBaseList();
    } catch (error) {
      console.error('删除失败:', error);
      message.error(t('kb.error.delete'));
    }
  };

  // 打开文档管理 Drawer
  const openDocumentsDrawer = (record: KnowledgeBase) => {
    setSelectedKbForDocuments(record.name);
    setDocumentsDrawerVisible(true);
  };

  // 表格列配置
  const columns: ColumnsType<KnowledgeBase> = [
    {
      title: t('kb.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      responsive: ['md'],
    },
    {
      title: t('kb.name'),
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true,
    },
    {
      title: t('kb.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['md'],
    },
    {
      title: t('kb.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      responsive: ['sm'],
    },
    {
      title: t('kb.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      responsive: ['sm'],
      render: (status: KBStatus) => (
        <Tag color={status === KBStatus.OK ? 'success' : 'error'}>
          {status === KBStatus.OK ? t('kb.enabled') : t('kb.disabled')}
        </Tag>
      ),
    },
    {
      title: t('kb.action'),
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="middle">
          <Button
            size="small"
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => openDocumentsDrawer(record)}
          >
            {t('kb.documents.documents')}
          </Button>
          <Button
            size="small"
            variant="solid"
            color="cyan"
            icon={<EditOutlined />}
            onClick={() => showEditDialog(record)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('kb.confirmDelete')}
            description={t('kb.deleteDesc')}
            onConfirm={() => confirmDelete(record)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button
              size="small"
              color="danger"
              variant="solid"
              danger
              icon={<DeleteOutlined />}
            >
              {t('kb.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="knowledge-base-container">
      <Card style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FolderOutlined style={{ marginRight: '8px', fontSize: '18px' }} />
            <Title level={4} style={{ margin: 0 }}>{t('kb.title')}</Title>
          </div>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={showAddDialog}
            style={{ height: "33px" }}
          >
            {t('kb.create')}
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
            size="small"
            locale={{
              emptyText: (
                <Empty
                  image={<FolderOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
                  description={t('kb.empty')}
                />
              )
            }}
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Card>

      {/* 新建/编辑知识库对话框 */}
      <Modal
        title={isEdit ? t('kb.edit') : t('kb.create')}
        open={dialogVisible}
        destroyOnHidden
        onCancel={() => {
          setDialogVisible(false);
          resetForm();
        }}
        footer={[
          <Button key="cancel" onClick={() => setDialogVisible(false)}>
            {t('common.cancel')}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={submitForm}
          >
            {t('common.confirm')}
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
            label={t('kb.name')}
            name="name"
            rules={rules.name}
          >
            <Input placeholder={t('kb.placeholder.name')} />
          </Form.Item>

          <Form.Item
            label={t('kb.description')}
            name="description"
            rules={rules.description}
          >
            <TextArea
              rows={3}
              placeholder={t('kb.placeholder.desc')}
            />
          </Form.Item>

          <Form.Item
            label={t('kb.category')}
            name="category"
            rules={rules.category}
          >
            <Input placeholder={t('kb.placeholder.category')} />
          </Form.Item>

          {isEdit && (
            <Form.Item
              label={t('kb.status')}
              name="status"
            >
              <Radio.Group>
                <Radio value={KBStatus.OK}>{t('kb.enabled')}</Radio>
                <Radio value={KBStatus.DISABLED}>{t('kb.disabled')}</Radio>
              </Radio.Group>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 文档管理 Drawer */}
      <Drawer
        title={`${t('kb.drawerTitle')} - ${selectedKbForDocuments}`}
        placement="right"
        size={1000}
        onClose={() => setDocumentsDrawerVisible(false)}
        open={documentsDrawerVisible}
        destroyOnHidden 
      >
        {selectedKbForDocuments && (
          <Documents knowledgeBaseName={selectedKbForDocuments} />
        )}
      </Drawer>
    </div>
  );
};

export default KnowledgeBase;