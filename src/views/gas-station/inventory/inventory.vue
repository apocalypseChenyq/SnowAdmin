<template>
  <div class="snow-page">
    <div class="snow-inner">
      <!-- 库存总览 -->
      <a-row :gutter="20" class="inventory-overview">
        <a-col :xs="24" :sm="12" :md="8" :lg="6" v-for="tank in fuelTanks" :key="tank.id">
          <a-card class="tank-card" :bordered="false">
            <div class="tank-header">
              <div class="tank-info">
                <div class="tank-name">{{ tank.name }}</div>
                <div class="fuel-type">{{ tank.fuelType }}</div>
              </div>
              <div class="tank-status" :class="getStatusClass(tank.status)">
                {{ getStatusText(tank.status) }}
              </div>
            </div>

            <div class="tank-progress">
              <a-progress
                :percent="tank.fillPercentage"
                :color="getProgressColor(tank.fillPercentage)"
                :track-color="'#f4f7f9'"
                :stroke-width="8"
              />
              <div class="progress-info">
                <span class="current-volume">{{ tank.currentVolume.toLocaleString() }}L</span>
                <span class="capacity"> / {{ tank.capacity.toLocaleString() }}L</span>
              </div>
            </div>

            <div class="tank-actions">
              <a-button size="small" type="outline" @click="handleViewTank(tank)">详情</a-button>
              <a-button size="small" type="primary" @click="handleAddStock(tank)">进货</a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 预警信息 -->
      <a-card title="库存预警" :bordered="false" class="alert-card" v-if="alerts.length > 0">
        <a-alert
          v-for="alert in alerts"
          :key="alert.id"
          :type="alert.type"
          :title="alert.title"
          :description="alert.description"
          :closable="true"
          class="alert-item"
          @close="handleCloseAlert(alert.id)"
        />
      </a-card>

      <!-- 搜索筛选 -->
      <a-form ref="formRef" auto-label-width :model="formData.form" class="search-form">
        <a-row :gutter="16">
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item field="stationId" label="加油站">
              <a-select v-model="formData.form.stationId" placeholder="请选择加油站" allow-clear>
                <a-option value="station1">北京朝阳1号站</a-option>
                <a-option value="station2">上海浦东2号站</a-option>
                <a-option value="station3">广州天河3号站</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item field="recordType" label="记录类型">
              <a-select v-model="formData.form.recordType" placeholder="请选择记录类型" allow-clear>
                <a-option value="purchase">进货</a-option>
                <a-option value="sale">销售</a-option>
                <a-option value="transfer">调拨</a-option>
                <a-option value="loss">损耗</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item field="dateRange" label="记录时间">
              <a-range-picker v-model="formData.form.dateRange" format="YYYY-MM-DD" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-space class="search-btn">
              <a-button type="primary" @click="getInventoryRecords">
                <template #icon>
                  <icon-search />
                </template>
                查询
              </a-button>
              <a-button @click="onReset">
                <template #icon>
                  <icon-refresh />
                </template>
                重置
              </a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-form>

      <!-- 操作按钮 -->
      <div class="table-operations">
        <a-space>
          <a-button type="primary" @click="handleBatchPurchase">
            <template #icon>
              <icon-plus />
            </template>
            批量进货
          </a-button>
          <a-button type="outline" @click="handleInventoryCheck">
            <template #icon>
              <icon-scan />
            </template>
            库存盘点
          </a-button>
          <a-button type="outline" @click="handleExport">
            <template #icon>
              <icon-download />
            </template>
            导出记录
          </a-button>
        </a-space>
      </div>

      <!-- 库存记录表格 -->
      <a-table
        row-key="id"
        size="small"
        :bordered="{ cell: true }"
        :scroll="{ x: '100%', y: '100%', minWidth: 1200 }"
        :loading="loading"
        :columns="columns"
        :data="data"
        :pagination="pagination"
        @page-change="pageChange"
        @page-size-change="pageSizeChange"
      >
        <template #recordType="{ record }">
          <a-tag :color="getRecordTypeColor(record.recordType)" size="small">
            {{ getRecordTypeText(record.recordType) }}
          </a-tag>
        </template>
        <template #volume="{ record }">
          <span :class="getVolumeClass(record.recordType)">
            {{ record.recordType === "sale" || record.recordType === "loss" ? "-" : "+" }}{{ record.volume.toLocaleString() }}L
          </span>
        </template>
        <template #amount="{ record }">
          <span class="amount-text">¥{{ record.amount.toLocaleString() }}</span>
        </template>
        <template #optional="{ record }">
          <a-space>
            <a-button size="mini" type="primary" @click="handleView(record)">详情</a-button>
            <a-button size="mini" @click="handleEdit(record)" v-if="record.status === 'pending'">编辑</a-button>
            <a-popconfirm content="确定要删除这条记录吗？" type="warning" @ok="handleDelete(record)">
              <a-button size="mini" type="primary" status="danger">删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </div>

    <!-- 进货弹窗 -->
    <a-modal
      v-model:visible="purchaseModalVisible"
      title="进货登记"
      width="600px"
      @ok="handleSavePurchase"
      @cancel="handleCancelPurchase"
    >
      <a-form ref="purchaseFormRef" :model="purchaseFormData" auto-label-width>
        <a-form-item field="stationId" label="加油站" :rules="[{ required: true, message: '请选择加油站' }]">
          <a-select v-model="purchaseFormData.stationId" placeholder="请选择加油站">
            <a-option value="station1">北京朝阳1号站</a-option>
            <a-option value="station2">上海浦东2号站</a-option>
            <a-option value="station3">广州天河3号站</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="fuelType" label="油品类型" :rules="[{ required: true, message: '请选择油品类型' }]">
          <a-select v-model="purchaseFormData.fuelType" placeholder="请选择油品类型">
            <a-option value="92#汽油">92#汽油</a-option>
            <a-option value="95#汽油">95#汽油</a-option>
            <a-option value="98#汽油">98#汽油</a-option>
            <a-option value="0#柴油">0#柴油</a-option>
            <a-option value="-10#柴油">-10#柴油</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="volume" label="进货数量(L)" :rules="[{ required: true, message: '请输入进货数量' }]">
          <a-input-number v-model="purchaseFormData.volume" :min="1" :max="50000" placeholder="请输入进货数量" />
        </a-form-item>
        <a-form-item field="unitPrice" label="进货单价(元/L)" :rules="[{ required: true, message: '请输入进货单价' }]">
          <a-input-number v-model="purchaseFormData.unitPrice" :min="0" :precision="2" placeholder="请输入进货单价" />
        </a-form-item>
        <a-form-item field="supplier" label="供应商" :rules="[{ required: true, message: '请输入供应商' }]">
          <a-input v-model="purchaseFormData.supplier" placeholder="请输入供应商名称" />
        </a-form-item>
        <a-form-item field="purchaseDate" label="进货时间" :rules="[{ required: true, message: '请选择进货时间' }]">
          <a-date-picker
            v-model="purchaseFormData.purchaseDate"
            show-time
            format="YYYY-MM-DD HH:mm"
            placeholder="请选择进货时间"
          />
        </a-form-item>
        <a-form-item field="remark" label="备注">
          <a-textarea v-model="purchaseFormData.remark" placeholder="请输入备注" :max-length="200" show-word-limit />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { Message } from "@arco-design/web-vue";
import { getInventoryRecordsAPI, createPurchaseRecordAPI } from "@/api/modules/gas-station/index";

interface FormData {
  form: {
    stationId: string;
    recordType: string;
    dateRange: string[];
  };
}

interface FuelTank {
  id: string;
  name: string;
  fuelType: string;
  capacity: number;
  currentVolume: number;
  fillPercentage: number;
  status: "normal" | "warning" | "critical" | "maintenance";
  stationId: string;
}

interface Alert {
  id: string;
  type: "warning" | "error" | "info";
  title: string;
  description: string;
}

interface InventoryRecord {
  id: string;
  stationName: string;
  fuelType: string;
  recordType: "purchase" | "sale" | "transfer" | "loss";
  volume: number;
  unitPrice: number;
  amount: number;
  supplier?: string;
  operator: string;
  recordTime: string;
  status: "pending" | "confirmed";
  remark?: string;
}

interface PurchaseFormData {
  stationId: string;
  fuelType: string;
  volume: number;
  unitPrice: number;
  supplier: string;
  purchaseDate: string;
  remark: string;
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
    stationId: "",
    recordType: "",
    dateRange: []
  }
});

const fuelTanks = reactive<FuelTank[]>([
  {
    id: "t1",
    name: "1号储油罐",
    fuelType: "92#汽油",
    capacity: 50000,
    currentVolume: 35000,
    fillPercentage: 70,
    status: "normal",
    stationId: "station1"
  },
  {
    id: "t2",
    name: "2号储油罐",
    fuelType: "95#汽油",
    capacity: 40000,
    currentVolume: 8000,
    fillPercentage: 20,
    status: "warning",
    stationId: "station1"
  },
  {
    id: "t3",
    name: "3号储油罐",
    fuelType: "98#汽油",
    capacity: 30000,
    currentVolume: 3000,
    fillPercentage: 10,
    status: "critical",
    stationId: "station1"
  },
  {
    id: "t4",
    name: "4号储油罐",
    fuelType: "0#柴油",
    capacity: 45000,
    currentVolume: 40500,
    fillPercentage: 90,
    status: "normal",
    stationId: "station1"
  },
  {
    id: "t5",
    name: "5号储油罐",
    fuelType: "-10#柴油",
    capacity: 35000,
    currentVolume: 0,
    fillPercentage: 0,
    status: "maintenance",
    stationId: "station1"
  }
]);

const alerts = reactive<Alert[]>([
  { id: "a1", type: "error", title: "3号储油罐库存严重不足", description: "98#汽油剩余3000L，已低于安全库存线，请及时补货" },
  { id: "a2", type: "warning", title: "2号储油罐库存偏低", description: "95#汽油剩余8000L，建议尽快安排补货" },
  { id: "a3", type: "info", title: "5号储油罐维护中", description: "-10#柴油储油罐正在进行定期维护，预计明日完成" }
]);

const purchaseFormData = reactive<PurchaseFormData>({
  stationId: "",
  fuelType: "",
  volume: 0,
  unitPrice: 0,
  supplier: "",
  purchaseDate: "",
  remark: ""
});

const pagination = ref<Pagination>({
  showPageSize: true,
  showTotal: true,
  current: 1,
  pageSize: 10,
  total: 0
});

const loading = ref<boolean>(false);
const data = reactive<InventoryRecord[]>([]);
const purchaseModalVisible = ref<boolean>(false);

const formRef = ref();
const purchaseFormRef = ref();

const columns = [
  {
    title: "加油站",
    dataIndex: "stationName",
    width: 150
  },
  {
    title: "油品类型",
    dataIndex: "fuelType",
    width: 100
  },
  {
    title: "记录类型",
    dataIndex: "recordType",
    slotName: "recordType",
    width: 100
  },
  {
    title: "数量变动",
    dataIndex: "volume",
    slotName: "volume",
    width: 120
  },
  {
    title: "单价(元/L)",
    dataIndex: "unitPrice",
    width: 100
  },
  {
    title: "金额",
    dataIndex: "amount",
    slotName: "amount",
    width: 120
  },
  {
    title: "供应商",
    dataIndex: "supplier",
    width: 120
  },
  {
    title: "操作员",
    dataIndex: "operator",
    width: 100
  },
  {
    title: "记录时间",
    dataIndex: "recordTime",
    width: 150
  },
  {
    title: "操作",
    slotName: "optional",
    align: "center",
    fixed: "right",
    width: 180
  }
];

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    normal: "status-normal",
    warning: "status-warning",
    critical: "status-critical",
    maintenance: "status-maintenance"
  };
  return classMap[status] || "";
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    normal: "正常",
    warning: "预警",
    critical: "紧急",
    maintenance: "维护中"
  };
  return textMap[status] || "未知";
};

const getProgressColor = (percentage: number) => {
  if (percentage <= 15) return "#fa4f4f";
  if (percentage <= 30) return "#f29324";
  return "#0abf5a";
};

const getRecordTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    purchase: "green",
    sale: "blue",
    transfer: "orange",
    loss: "red"
  };
  return colorMap[type] || "gray";
};

const getRecordTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    purchase: "进货",
    sale: "销售",
    transfer: "调拨",
    loss: "损耗"
  };
  return textMap[type] || "未知";
};

const getVolumeClass = (type: string) => {
  return type === "sale" || type === "loss" ? "volume-decrease" : "volume-increase";
};

const pageChange = (page: number) => {
  pagination.value.current = page;
  getInventoryRecords();
};

const pageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  getInventoryRecords();
};

const onReset = () => {
  formRef.value.resetFields();
  getInventoryRecords();
};

const getInventoryRecords = async () => {
  try {
    loading.value = true;
    const params = {
      ...formData.form,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    };
    const res = await getInventoryRecordsAPI(params);
    Object.assign(data, res.data.list);
    pagination.value.total = res.data.total;
  } finally {
    loading.value = false;
  }
};

const handleViewTank = (tank: FuelTank) => {
  Message.info(`查看储油罐详情: ${tank.name}`);
};

const handleAddStock = (tank: FuelTank) => {
  purchaseFormData.fuelType = tank.fuelType;
  purchaseModalVisible.value = true;
};

const handleCloseAlert = (alertId: string) => {
  const index = alerts.findIndex(alert => alert.id === alertId);
  if (index !== -1) {
    alerts.splice(index, 1);
  }
};

const handleBatchPurchase = () => {
  purchaseModalVisible.value = true;
};

const handleInventoryCheck = () => {
  Message.info("库存盘点功能开发中");
};

const handleExport = () => {
  Message.info("导出功能开发中");
};

const handleView = (record: InventoryRecord) => {
  Message.info(`查看记录详情: ${record.id}`);
};

const handleEdit = (record: InventoryRecord) => {
  Message.info(`编辑记录: ${record.id}`);
};

const handleDelete = async (record: InventoryRecord) => {
  try {
    Message.success("记录删除成功");
    getInventoryRecords();
  } catch (error) {
    Message.error("删除失败");
  }
};

const handleSavePurchase = async () => {
  try {
    const valid = await purchaseFormRef.value.validate();
    if (!valid) return;

    await createPurchaseRecordAPI(purchaseFormData);
    Message.success("进货记录保存成功");
    purchaseModalVisible.value = false;
    getInventoryRecords();
  } catch (error) {
    Message.error("保存失败");
  }
};

const handleCancelPurchase = () => {
  purchaseModalVisible.value = false;
  resetPurchaseForm();
};

const resetPurchaseForm = () => {
  Object.assign(purchaseFormData, {
    stationId: "",
    fuelType: "",
    volume: 0,
    unitPrice: 0,
    supplier: "",
    purchaseDate: "",
    remark: ""
  });
  purchaseFormRef.value?.resetFields();
};

onMounted(() => {
  getInventoryRecords();
});
</script>

<style lang="scss" scoped>
.inventory-overview {
  margin-bottom: 20px;
}

.tank-card {
  height: 200px;

  .tank-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    .tank-info {
      .tank-name {
        font-size: 16px;
        font-weight: 600;
        color: #1b2a3e;
        margin-bottom: 4px;
      }

      .fuel-type {
        font-size: 12px;
        color: #8492a6;
      }
    }

    .tank-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;

      &.status-normal {
        color: #0abf5a;
        background: #e6f7ed;
      }

      &.status-warning {
        color: #f29324;
        background: #fff7e6;
      }

      &.status-critical {
        color: #fa4f4f;
        background: #ffeded;
      }

      &.status-maintenance {
        color: #8492a6;
        background: #f4f7f9;
      }
    }
  }

  .tank-progress {
    margin-bottom: 16px;

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 14px;

      .current-volume {
        font-weight: 600;
        color: #1b2a3e;
      }

      .capacity {
        color: #8492a6;
      }
    }
  }

  .tank-actions {
    display: flex;
    gap: 8px;
  }
}

.alert-card {
  margin-bottom: 20px;

  .alert-item {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.search-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.search-btn {
  margin-bottom: 20px;
}

.table-operations {
  margin-bottom: 16px;
}

.volume-increase {
  color: #0abf5a;
  font-weight: 600;
}

.volume-decrease {
  color: #fa4f4f;
  font-weight: 600;
}

.amount-text {
  font-weight: 600;
  color: #0094ff;
}

:deep(.arco-card-header) {
  border-bottom: 1px solid #e8edf5;
}

:deep(.arco-card-body) {
  padding: 20px;
}

:deep(.arco-progress-circle-text) {
  font-size: 12px;
}
</style>
