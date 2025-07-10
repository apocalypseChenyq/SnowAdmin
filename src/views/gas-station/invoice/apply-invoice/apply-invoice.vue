<template>
  <div class="snow-page">
    <div class="snow-inner">
      <!-- 时间筛选区域 -->
      <div class="time-filter-section">
        <div class="filter-row">
          <span class="filter-label">请选择时间周期：</span>
          <a-range-picker v-model="dateRange" format="YYYY/MM/DD" style="width: 280px" :placeholder="['开始日期', '结束日期']" />

          <div class="quick-time-buttons">
            <a-button
              v-for="timeOption in timeOptions"
              :key="timeOption.key"
              :type="selectedTimeType === timeOption.key ? 'primary' : 'outline'"
              size="small"
              @click="handleQuickTimeSelect(timeOption.key)"
            >
              {{ timeOption.label }}
            </a-button>
          </div>

          <a-select v-model="selectedPeriod" style="width: 100px">
            <a-option value="week">周</a-option>
            <a-option value="month">月</a-option>
            <a-option value="quarter">季</a-option>
            <a-option value="year">年</a-option>
          </a-select>

          <div class="nav-buttons">
            <a-button size="small" @click="handlePrevPeriod">
              <icon-left />
            </a-button>
            <a-button size="small" @click="handleNextPeriod">
              <icon-right />
            </a-button>
          </div>

          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">清空</a-button>
          </a-space>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="invoice-table-section">
        <a-table
          row-key="id"
          :columns="columns"
          :data="tableData"
          :pagination="pagination"
          :loading="loading"
          :row-selection="rowSelection"
          size="medium"
          :bordered="{ cell: true }"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        >
          <template #stationName="{ record }">
            <span class="station-name">{{ record.stationName }}</span>
          </template>
          <template #region="{ record }">
            <span class="region-text">{{ record.region }}</span>
          </template>
          <template #naturalGasAmount="{ record }">
            <span class="amount-text">{{ record.naturalGasAmount.toLocaleString() }}</span>
          </template>
          <template #dieselAmount="{ record }">
            <span class="amount-text">{{ record.dieselAmount.toLocaleString() }}</span>
          </template>
          <template #invoiceHeader="{ record }">
            <span class="invoice-header">{{ record.invoiceHeader }}</span>
          </template>
        </a-table>
      </div>

      <!-- 申请开票按钮 -->
      <div class="apply-invoice-button">
        <a-button type="primary" size="large" :disabled="selectedRows.length === 0" @click="handleApplyInvoice">
          申请开票
        </a-button>
      </div>
    </div>

    <!-- 申请开票弹窗 -->
    <a-modal
      v-model:visible="invoiceModalVisible"
      title="申请开票"
      width="600px"
      @ok="handleConfirmApply"
      @cancel="handleCancelApply"
    >
      <div class="invoice-form">
        <a-descriptions :column="1" :bordered="true">
          <a-descriptions-item label="选中记录数">{{ selectedRows.length }} 条</a-descriptions-item>
          <a-descriptions-item label="开票总金额">
            <span class="total-amount">¥{{ totalInvoiceAmount.toLocaleString() }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="发票类型">
            <a-radio-group v-model="invoiceForm.invoiceType">
              <a-radio value="vat">增值税专用发票</a-radio>
              <a-radio value="common">增值税普通发票</a-radio>
            </a-radio-group>
          </a-descriptions-item>
          <a-descriptions-item label="发票抬头">
            <a-input v-model="invoiceForm.invoiceHeader" placeholder="请输入发票抬头" />
          </a-descriptions-item>
          <a-descriptions-item label="纳税人识别号">
            <a-input v-model="invoiceForm.taxNumber" placeholder="请输入纳税人识别号" />
          </a-descriptions-item>
          <a-descriptions-item label="开户银行">
            <a-input v-model="invoiceForm.bankName" placeholder="请输入开户银行" />
          </a-descriptions-item>
          <a-descriptions-item label="银行账号">
            <a-input v-model="invoiceForm.bankAccount" placeholder="请输入银行账号" />
          </a-descriptions-item>
          <a-descriptions-item label="注册地址">
            <a-input v-model="invoiceForm.registeredAddress" placeholder="请输入注册地址" />
          </a-descriptions-item>
          <a-descriptions-item label="联系电话">
            <a-input v-model="invoiceForm.contactPhone" placeholder="请输入联系电话" />
          </a-descriptions-item>
          <a-descriptions-item label="备注">
            <a-textarea v-model="invoiceForm.remark" placeholder="请输入备注信息" :max-length="200" show-word-limit />
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { Message } from "@arco-design/web-vue";
import { getInvoiceDataAPI, applyInvoiceAPI } from "@/api/modules/gas-station/index";

interface InvoiceData {
  id: string;
  stationName: string;
  region: string;
  naturalGasAmount: number;
  dieselAmount: number;
  invoiceHeader: string;
  createTime: string;
}

interface TimeOption {
  key: string;
  label: string;
}

interface InvoiceForm {
  invoiceType: string;
  invoiceHeader: string;
  taxNumber: string;
  bankName: string;
  bankAccount: string;
  registeredAddress: string;
  contactPhone: string;
  remark: string;
}

interface Pagination {
  current: number;
  pageSize: number;
  total: number;
  showTotal: boolean;
  showPageSize: boolean;
}

const dateRange = ref<string[]>(["2023/09/20", "2023/09/27"]);
const selectedTimeType = ref<string>("thisWeek");
const selectedPeriod = ref<string>("week");
const loading = ref<boolean>(false);
const invoiceModalVisible = ref<boolean>(false);

const timeOptions = reactive<TimeOption[]>([
  { key: "thisWeek", label: "本周" },
  { key: "thisMonth", label: "本月" },
  { key: "nearThreeMonths", label: "近三月" },
  { key: "nearSixMonths", label: "近六月" },
  { key: "thisYear", label: "本年" }
]);

const tableData = reactive<InvoiceData[]>([]);

const invoiceForm = reactive<InvoiceForm>({
  invoiceType: "vat",
  invoiceHeader: "上海天域物流有限公司",
  taxNumber: "",
  bankName: "",
  bankAccount: "",
  registeredAddress: "",
  contactPhone: "",
  remark: ""
});

const pagination = reactive<Pagination>({
  current: 5,
  pageSize: 10,
  total: 450,
  showTotal: true,
  showPageSize: true
});

const selectedRows = ref<InvoiceData[]>([]);

const rowSelection = reactive({
  type: "checkbox",
  showCheckedAll: true,
  onSelect: (rowKeys: string[], selectedData: InvoiceData[]) => {
    selectedRows.value = selectedData;
  },
  onSelectAll: (selected: boolean, selectedData: InvoiceData[]) => {
    selectedRows.value = selectedData;
  }
});

const columns = [
  {
    title: "油站名称",
    dataIndex: "stationName",
    slotName: "stationName",
    width: 200
  },
  {
    title: "油站地区",
    dataIndex: "region",
    slotName: "region",
    width: 150
  },
  {
    title: "天然气开票金额",
    dataIndex: "naturalGasAmount",
    slotName: "naturalGasAmount",
    width: 150,
    align: "right"
  },
  {
    title: "柴油开票金额",
    dataIndex: "dieselAmount",
    slotName: "dieselAmount",
    width: 150,
    align: "right"
  },
  {
    title: "发票抬头",
    dataIndex: "invoiceHeader",
    slotName: "invoiceHeader",
    width: 200
  }
];

const totalInvoiceAmount = computed(() => {
  return selectedRows.value.reduce((total, row) => {
    return total + row.naturalGasAmount + row.dieselAmount;
  }, 0);
});

const handleQuickTimeSelect = (timeType: string) => {
  selectedTimeType.value = timeType;
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now);

  switch (timeType) {
    case "thisWeek":
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      break;
    case "thisMonth":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "nearThreeMonths":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "nearSixMonths":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      break;
    case "thisYear":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now);
  }

  dateRange.value = [
    startDate.toISOString().split("T")[0].replace(/-/g, "/"),
    endDate.toISOString().split("T")[0].replace(/-/g, "/")
  ];
};

const handlePrevPeriod = () => {
  // 处理上一个周期
  Message.info("上一个周期");
};

const handleNextPeriod = () => {
  // 处理下一个周期
  Message.info("下一个周期");
};

const handleSearch = () => {
  getInvoiceData();
};

const handleReset = () => {
  dateRange.value = [];
  selectedTimeType.value = "";
  getInvoiceData();
};

const handlePageChange = (page: number) => {
  pagination.current = page;
  getInvoiceData();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.current = 1;
  getInvoiceData();
};

const handleApplyInvoice = () => {
  if (selectedRows.value.length === 0) {
    Message.warning("请选择要开票的记录");
    return;
  }
  invoiceModalVisible.value = true;
};

const handleConfirmApply = async () => {
  try {
    const requestData = {
      invoiceItems: selectedRows.value.map(row => row.id),
      ...invoiceForm
    };

    await applyInvoiceAPI(requestData);
    Message.success("开票申请提交成功");
    invoiceModalVisible.value = false;
    selectedRows.value = [];
    getInvoiceData();
  } catch (error) {
    Message.error("开票申请提交失败");
  }
};

const handleCancelApply = () => {
  invoiceModalVisible.value = false;
};

const getInvoiceData = async () => {
  try {
    loading.value = true;
    const params = {
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
      page: pagination.current,
      pageSize: pagination.pageSize
    };

    const response = await getInvoiceDataAPI(params);
    Object.assign(tableData, response.data.list);
    pagination.total = response.data.total;
  } catch (error) {
    Message.error("获取数据失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  handleQuickTimeSelect("thisWeek");
  getInvoiceData();
});
</script>

<style lang="scss" scoped>
.time-filter-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 16px;

  .filter-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    .filter-label {
      font-size: 14px;
      color: #4b5c73;
      white-space: nowrap;
    }

    .quick-time-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .nav-buttons {
      display: flex;
      gap: 4px;
    }
  }
}

.invoice-table-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;

  .station-name {
    font-weight: 500;
    color: #1b2a3e;
  }

  .region-text {
    color: #4b5c73;
  }

  .amount-text {
    font-weight: 600;
    color: #1b2a3e;
    font-family: "SF Mono", Consolas, monospace;
  }

  .invoice-header {
    color: #4b5c73;
  }
}

.apply-invoice-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 100;

  .arco-btn {
    height: 48px;
    padding: 0 32px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 148, 255, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 148, 255, 0.4);
    }
  }
}

.invoice-form {
  .total-amount {
    font-size: 18px;
    font-weight: 600;
    color: #0094ff;
  }
}

:deep(.arco-table) {
  .arco-table-th {
    background-color: #f8fafe;
    color: #4b5c73;
    font-weight: 600;
  }

  .arco-table-td {
    border-bottom: 1px solid #e8edf5;
  }

  .arco-table-tr:hover .arco-table-td {
    background-color: #f8fafe;
  }
}

:deep(.arco-pagination) {
  justify-content: center;
  padding: 20px 0;
}

:deep(.arco-descriptions-item-label) {
  background-color: #f8fafe;
  font-weight: 500;
  color: #4b5c73;
}

@media (max-width: 768px) {
  .time-filter-section .filter-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .quick-time-buttons {
      width: 100%;
      justify-content: flex-start;
    }
  }

  .apply-invoice-button {
    bottom: 20px;
    right: 20px;

    .arco-btn {
      height: 44px;
      padding: 0 24px;
      font-size: 14px;
    }
  }
}
</style>
