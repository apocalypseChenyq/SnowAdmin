<template>
  <div class="snow-page">
    <div class="snow-inner">
      <!-- 搜索表单 -->
      <a-form ref="formRef" auto-label-width :model="formData.form">
        <a-row :gutter="16">
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="6" :xxl="6">
            <a-form-item field="stationName" label="加油站名称">
              <a-input v-model="formData.form.stationName" placeholder="请输入加油站名称" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="6" :xxl="6">
            <a-form-item field="stationCode" label="站点编码">
              <a-input v-model="formData.form.stationCode" placeholder="请输入站点编码" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="6" :xxl="6">
            <a-form-item field="status" label="运营状态">
              <a-select v-model="formData.form.status" placeholder="请选择运营状态" allow-clear>
                <a-option value="1">营业中</a-option>
                <a-option value="2">暂停营业</a-option>
                <a-option value="3">维护中</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="6" :xxl="6">
            <a-space class="search-btn">
              <a-button type="primary" @click="getStationList">
                <template #icon>
                  <icon-search />
                </template>
                <template #default>查询</template>
              </a-button>
              <a-button @click="onReset">
                <template #icon>
                  <icon-refresh />
                </template>
                <template #default>重置</template>
              </a-button>
              <a-button type="text" @click="formData.search = !formData.search">
                <template #icon>
                  <icon-up v-if="formData.search" />
                  <icon-down v-else />
                </template>
                <template #default>{{ formData.search ? "收起" : "展开" }}</template>
              </a-button>
            </a-space>
          </a-col>
        </a-row>
        <a-row :gutter="16" v-if="formData.search">
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="6" :xxl="6">
            <a-form-item field="city" label="所在城市">
              <a-input v-model="formData.form.city" placeholder="请输入所在城市" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="6" :xxl="6">
            <a-form-item field="brand" label="品牌类型">
              <a-select v-model="formData.form.brand" placeholder="请选择品牌类型" allow-clear>
                <a-option value="中石油">中石油</a-option>
                <a-option value="中石化">中石化</a-option>
                <a-option value="中海油">中海油</a-option>
                <a-option value="其他">其他</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <!-- 操作按钮 -->
      <div class="table-operations">
        <a-space>
          <a-button type="primary" @click="handleAdd">
            <template #icon>
              <icon-plus />
            </template>
            新增加油站
          </a-button>
          <a-button type="outline" :disabled="!selectedKeys.length" @click="handleBatchDelete">
            <template #icon>
              <icon-delete />
            </template>
            批量删除
          </a-button>
          <a-button type="outline" @click="handleExport">
            <template #icon>
              <icon-download />
            </template>
            导出数据
          </a-button>
        </a-space>
      </div>

      <!-- 数据表格 -->
      <a-table
        row-key="id"
        size="small"
        :bordered="{
          cell: true
        }"
        :scroll="{ x: '100%', y: '100%', minWidth: 1200 }"
        :loading="loading"
        :columns="columns"
        :data="data"
        :row-selection="rowSelection"
        v-model:selectedKeys="selectedKeys"
        :pagination="pagination"
        @page-change="pageChange"
        @page-size-change="pageSizeChange"
      >
        <template #status="{ record }">
          <a-space>
            <a-tag size="small" color="green" v-if="record.status == 1">营业中</a-tag>
            <a-tag size="small" color="orange" v-else-if="record.status == 2">暂停营业</a-tag>
            <a-tag size="small" color="blue" v-else>维护中</a-tag>
          </a-space>
        </template>
        <template #fuelTypes="{ record }">
          <a-space wrap>
            <a-tag v-for="fuel in record.fuelTypes" :key="fuel" size="small" color="arcoblue">
              {{ fuel }}
            </a-tag>
          </a-space>
        </template>
        <template #revenue="{ record }">
          <span class="revenue-text">¥{{ record.revenue.toLocaleString() }}</span>
        </template>
        <template #optional="{ record }">
          <a-space>
            <a-button size="mini" type="primary" @click="handleView(record)">详情</a-button>
            <a-button size="mini" @click="handleEdit(record)">编辑</a-button>
            <a-dropdown>
              <a-button size="mini" type="text">
                更多
                <icon-down />
              </a-button>
              <template #content>
                <a-doption @click="handleToggleStatus(record)">
                  {{ record.status == 1 ? "暂停营业" : "恢复营业" }}
                </a-doption>
                <a-doption @click="handleViewStats(record)">营业统计</a-doption>
                <a-doption class="danger-option" @click="handleDelete(record)">删除</a-doption>
              </template>
            </a-dropdown>
          </a-space>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:visible="modalVisible" :title="modalTitle" width="800px" @ok="handleSave" @cancel="handleCancel">
      <a-form ref="modalFormRef" :model="modalFormData" auto-label-width>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="stationName" label="加油站名称" :rules="[{ required: true, message: '请输入加油站名称' }]">
              <a-input v-model="modalFormData.stationName" placeholder="请输入加油站名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="stationCode" label="站点编码" :rules="[{ required: true, message: '请输入站点编码' }]">
              <a-input v-model="modalFormData.stationCode" placeholder="请输入站点编码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="brand" label="品牌类型" :rules="[{ required: true, message: '请选择品牌类型' }]">
              <a-select v-model="modalFormData.brand" placeholder="请选择品牌类型">
                <a-option value="中石油">中石油</a-option>
                <a-option value="中石化">中石化</a-option>
                <a-option value="中海油">中海油</a-option>
                <a-option value="其他">其他</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="manager" label="站长姓名" :rules="[{ required: true, message: '请输入站长姓名' }]">
              <a-input v-model="modalFormData.manager" placeholder="请输入站长姓名" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="phone" label="联系电话" :rules="[{ required: true, message: '请输入联系电话' }]">
              <a-input v-model="modalFormData.phone" placeholder="请输入联系电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="city" label="所在城市" :rules="[{ required: true, message: '请输入所在城市' }]">
              <a-input v-model="modalFormData.city" placeholder="请输入所在城市" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item field="address" label="详细地址" :rules="[{ required: true, message: '请输入详细地址' }]">
          <a-input v-model="modalFormData.address" placeholder="请输入详细地址" />
        </a-form-item>
        <a-form-item field="fuelTypes" label="油品类型" :rules="[{ required: true, message: '请选择油品类型' }]">
          <a-checkbox-group v-model="modalFormData.fuelTypes">
            <a-checkbox value="92#汽油">92#汽油</a-checkbox>
            <a-checkbox value="95#汽油">95#汽油</a-checkbox>
            <a-checkbox value="98#汽油">98#汽油</a-checkbox>
            <a-checkbox value="0#柴油">0#柴油</a-checkbox>
            <a-checkbox value="-10#柴油">-10#柴油</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item field="description" label="备注说明">
          <a-textarea v-model="modalFormData.description" placeholder="请输入备注说明" :max-length="200" show-word-limit />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import {
  getGasStationListAPI,
  createGasStationAPI,
  updateGasStationAPI,
  deleteGasStationAPI
} from "@/api/modules/gas-station/index";
import { Message } from "@arco-design/web-vue";

interface FormData {
  form: {
    stationName: string;
    stationCode: string;
    city: string;
    brand: string;
    status: string | null;
  };
  search: boolean;
}

interface StationData {
  id: string;
  stationName: string;
  stationCode: string;
  brand: string;
  manager: string;
  phone: string;
  city: string;
  address: string;
  status: number;
  fuelTypes: string[];
  revenue: number;
  createTime: string;
  description?: string;
}

interface ModalFormData {
  id?: string;
  stationName: string;
  stationCode: string;
  brand: string;
  manager: string;
  phone: string;
  city: string;
  address: string;
  fuelTypes: string[];
  description: string;
}

interface RowSelection {
  type: string;
  showCheckedAll: boolean;
  onlyCurrent: boolean;
}

interface Pagination {
  showPageSize: boolean;
  showTotal: boolean;
  current: number;
  pageSize: number;
  total: number;
}

const formData = reactive<FormData>({
  form: {
    stationName: "",
    stationCode: "",
    city: "",
    brand: "",
    status: null
  },
  search: false
});

const modalFormData = reactive<ModalFormData>({
  stationName: "",
  stationCode: "",
  brand: "",
  manager: "",
  phone: "",
  city: "",
  address: "",
  fuelTypes: [],
  description: ""
});

const selectedKeys = ref<string[]>([]);
const rowSelection = reactive<RowSelection>({
  type: "checkbox",
  showCheckedAll: true,
  onlyCurrent: false
});

const pagination = ref<Pagination>({
  showPageSize: true,
  showTotal: true,
  current: 1,
  pageSize: 10,
  total: 0
});

const loading = ref<boolean>(false);
const data = reactive<StationData[]>([]);
const modalVisible = ref<boolean>(false);
const modalTitle = ref<string>("");
const isEdit = ref<boolean>(false);

const formRef = ref();
const modalFormRef = ref();

const columns = [
  {
    title: "站点编码",
    dataIndex: "stationCode",
    width: 120
  },
  {
    title: "加油站名称",
    dataIndex: "stationName",
    width: 180
  },
  {
    title: "品牌",
    dataIndex: "brand",
    width: 80
  },
  {
    title: "站长",
    dataIndex: "manager",
    width: 100
  },
  {
    title: "联系电话",
    dataIndex: "phone",
    width: 120
  },
  {
    title: "所在城市",
    dataIndex: "city",
    width: 100
  },
  {
    title: "运营状态",
    dataIndex: "status",
    align: "center",
    slotName: "status",
    width: 100
  },
  {
    title: "油品类型",
    dataIndex: "fuelTypes",
    slotName: "fuelTypes",
    width: 150
  },
  {
    title: "月营业额",
    dataIndex: "revenue",
    slotName: "revenue",
    align: "right",
    width: 120
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    width: 120
  },
  {
    title: "操作",
    slotName: "optional",
    align: "center",
    fixed: "right",
    width: 160
  }
];

const pageChange = (page: number) => {
  pagination.value.current = page;
  getStationList();
};

const pageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  getStationList();
};

const onReset = () => {
  formRef.value.resetFields();
  getStationList();
};

const getStationList = async () => {
  try {
    loading.value = true;
    const params = {
      ...formData.form,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    };
    const res = await getGasStationListAPI(params);
    Object.assign(data, res.data.list);
    pagination.value.total = res.data.total;
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  modalTitle.value = "新增加油站";
  isEdit.value = false;
  resetModalForm();
  modalVisible.value = true;
};

const handleEdit = (record: StationData) => {
  modalTitle.value = "编辑加油站";
  isEdit.value = true;
  Object.assign(modalFormData, record);
  modalVisible.value = true;
};

const handleView = (record: StationData) => {
  // 跳转到详情页面或打开详情弹窗
  Message.info("查看详情功能待开发");
};

const handleDelete = async (record: StationData) => {
  try {
    await deleteGasStationAPI(record.id);
    Message.success("删除成功");
    getStationList();
  } catch (error) {
    Message.error("删除失败");
  }
};

const handleBatchDelete = () => {
  // 批量删除逻辑
  Message.info("批量删除功能待开发");
};

const handleExport = () => {
  // 导出数据逻辑
  Message.info("导出功能待开发");
};

const handleToggleStatus = async (record: StationData) => {
  try {
    const newStatus = record.status === 1 ? 2 : 1;
    await updateGasStationAPI(record.id, { status: newStatus });
    Message.success("状态更新成功");
    getStationList();
  } catch (error) {
    Message.error("状态更新失败");
  }
};

const handleViewStats = (record: StationData) => {
  Message.info("营业统计功能待开发");
};

const handleSave = async () => {
  try {
    const valid = await modalFormRef.value.validate();
    if (!valid) {
      return;
    }

    if (isEdit.value) {
      await updateGasStationAPI(modalFormData.id!, modalFormData);
      Message.success("更新成功");
    } else {
      await createGasStationAPI(modalFormData);
      Message.success("创建成功");
    }

    modalVisible.value = false;
    getStationList();
  } catch (error) {
    Message.error(isEdit.value ? "更新失败" : "创建失败");
  }
};

const handleCancel = () => {
  modalVisible.value = false;
  resetModalForm();
};

const resetModalForm = () => {
  Object.assign(modalFormData, {
    stationName: "",
    stationCode: "",
    brand: "",
    manager: "",
    phone: "",
    city: "",
    address: "",
    fuelTypes: [],
    description: ""
  });
  modalFormRef.value?.resetFields();
};

onMounted(() => {
  getStationList();
});
</script>

<style lang="scss" scoped>
.search-btn {
  margin-bottom: 20px;
}

.table-operations {
  margin-bottom: 16px;
}

.revenue-text {
  font-weight: 600;
  color: #0094ff;
}

.danger-option {
  color: #f53f3f;
}

:deep(.arco-table-cell) {
  padding: 8px 12px;
}

:deep(.arco-tag) {
  margin: 2px;
}
</style>
