<template>
  <div class="snow-page">
    <div class="snow-inner">
      <!-- 当前油价展示 -->
      <a-card title="当前油价" :bordered="false" class="current-price-card">
        <a-row :gutter="20">
          <a-col :xs="24" :sm="12" :md="8" :lg="6" v-for="price in currentPrices" :key="price.fuelType">
            <div class="price-item">
              <div class="fuel-info">
                <div class="fuel-type">{{ price.fuelType }}</div>
                <div class="fuel-desc">{{ price.description }}</div>
              </div>
              <div class="price-info">
                <div class="current-price">¥{{ price.currentPrice }}/升</div>
                <div class="price-change" :class="price.changeType">
                  <icon-arrow-up v-if="price.changeType === 'up'" />
                  <icon-arrow-down v-if="price.changeType === 'down'" />
                  <icon-minus v-if="price.changeType === 'same'" />
                  {{ price.changeAmount }}
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </a-card>

      <!-- 搜索筛选 -->
      <a-form ref="formRef" auto-label-width :model="formData.form" class="search-form">
        <a-row :gutter="16">
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item field="fuelType" label="油品类型">
              <a-select v-model="formData.form.fuelType" placeholder="请选择油品类型" allow-clear>
                <a-option value="92#汽油">92#汽油</a-option>
                <a-option value="95#汽油">95#汽油</a-option>
                <a-option value="98#汽油">98#汽油</a-option>
                <a-option value="0#柴油">0#柴油</a-option>
                <a-option value="-10#柴油">-10#柴油</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item field="changeType" label="调价类型">
              <a-select v-model="formData.form.changeType" placeholder="请选择调价类型" allow-clear>
                <a-option value="up">上调</a-option>
                <a-option value="down">下调</a-option>
                <a-option value="same">持平</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item field="dateRange" label="调价时间">
              <a-range-picker v-model="formData.form.dateRange" format="YYYY-MM-DD" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-space class="search-btn">
              <a-button type="primary" @click="getPriceHistory">
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
          <a-button type="primary" @click="handlePriceAdjustment">
            <template #icon>
              <icon-edit />
            </template>
            调价设置
          </a-button>
          <a-button type="outline" @click="handleBatchPriceUpdate">
            <template #icon>
              <icon-swap />
            </template>
            批量调价
          </a-button>
          <a-button type="outline" @click="handleExport">
            <template #icon>
              <icon-download />
            </template>
            导出记录
          </a-button>
        </a-space>
      </div>

      <!-- 调价历史记录 -->
      <a-table
        row-key="id"
        size="small"
        :bordered="{ cell: true }"
        :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
        :loading="loading"
        :columns="columns"
        :data="data"
        :pagination="pagination"
        @page-change="pageChange"
        @page-size-change="pageSizeChange"
      >
        <template #fuelType="{ record }">
          <a-tag :color="getFuelTypeColor(record.fuelType)" size="small">
            {{ record.fuelType }}
          </a-tag>
        </template>
        <template #priceChange="{ record }">
          <div class="price-change-cell">
            <div class="price-display">
              <span class="old-price">¥{{ record.oldPrice }}</span>
              <icon-arrow-right class="arrow" />
              <span class="new-price">¥{{ record.newPrice }}</span>
            </div>
            <div class="change-amount" :class="record.changeType">
              <icon-arrow-up v-if="record.changeType === 'up'" />
              <icon-arrow-down v-if="record.changeType === 'down'" />
              <icon-minus v-if="record.changeType === 'same'" />
              {{ Math.abs(record.changeAmount).toFixed(2) }}
            </div>
          </div>
        </template>
        <template #effectiveTime="{ record }">
          <div class="time-cell">
            <div class="effect-time">{{ record.effectiveTime }}</div>
            <div class="status" :class="record.status">
              {{ record.status === "active" ? "已生效" : record.status === "pending" ? "待生效" : "已失效" }}
            </div>
          </div>
        </template>
        <template #optional="{ record }">
          <a-space>
            <a-button size="mini" type="primary" @click="handleView(record)">详情</a-button>
            <a-button size="mini" @click="handleEdit(record)" v-if="record.status === 'pending'">修改</a-button>
            <a-popconfirm
              content="确定要撤销这次调价吗？"
              type="warning"
              v-if="record.status === 'pending'"
              @ok="handleCancel(record)"
            >
              <a-button size="mini" type="primary" status="danger">撤销</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </div>

    <!-- 调价设置弹窗 -->
    <a-modal
      v-model:visible="priceModalVisible"
      title="调价设置"
      width="600px"
      @ok="handleSavePriceAdjustment"
      @cancel="handleCancelPriceModal"
    >
      <a-form ref="priceFormRef" :model="priceFormData" auto-label-width>
        <a-form-item field="fuelType" label="油品类型" :rules="[{ required: true, message: '请选择油品类型' }]">
          <a-select v-model="priceFormData.fuelType" placeholder="请选择油品类型">
            <a-option value="92#汽油">92#汽油</a-option>
            <a-option value="95#汽油">95#汽油</a-option>
            <a-option value="98#汽油">98#汽油</a-option>
            <a-option value="0#柴油">0#柴油</a-option>
            <a-option value="-10#柴油">-10#柴油</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="adjustmentType" label="调价方式" :rules="[{ required: true, message: '请选择调价方式' }]">
          <a-radio-group v-model="priceFormData.adjustmentType">
            <a-radio value="fixed">固定价格</a-radio>
            <a-radio value="amount">调价金额</a-radio>
            <a-radio value="percentage">调价比例</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item
          :field="priceFormData.adjustmentType === 'fixed' ? 'newPrice' : 'adjustmentValue'"
          :label="getAdjustmentLabel()"
          :rules="[{ required: true, message: '请输入调价数值' }]"
        >
          <a-input-number
            v-if="priceFormData.adjustmentType === 'fixed'"
            v-model="priceFormData.newPrice"
            :min="0"
            :precision="2"
            placeholder="请输入新价格"
          />
          <a-input-number
            v-else-if="priceFormData.adjustmentType === 'amount'"
            v-model="priceFormData.adjustmentValue"
            :precision="2"
            placeholder="请输入调价金额（正数上调，负数下调）"
          />
          <a-input-number
            v-else
            v-model="priceFormData.adjustmentValue"
            :min="-100"
            :max="100"
            :precision="2"
            placeholder="请输入调价比例（%）"
          />
        </a-form-item>
        <a-form-item field="effectiveTime" label="生效时间" :rules="[{ required: true, message: '请选择生效时间' }]">
          <a-date-picker v-model="priceFormData.effectiveTime" show-time format="YYYY-MM-DD HH:mm" placeholder="请选择生效时间" />
        </a-form-item>
        <a-form-item field="reason" label="调价原因" :rules="[{ required: true, message: '请输入调价原因' }]">
          <a-textarea v-model="priceFormData.reason" placeholder="请输入调价原因" :max-length="200" show-word-limit />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Message } from "@arco-design/web-vue";
import { getFuelPriceHistoryAPI, createPriceAdjustmentAPI } from "@/api/modules/gas-station/index";

interface FormData {
  form: {
    fuelType: string;
    changeType: string;
    dateRange: string[];
  };
}

interface CurrentPrice {
  fuelType: string;
  description: string;
  currentPrice: number;
  changeType: "up" | "down" | "same";
  changeAmount: string;
}

interface PriceHistoryData {
  id: string;
  fuelType: string;
  oldPrice: number;
  newPrice: number;
  changeAmount: number;
  changeType: "up" | "down" | "same";
  effectiveTime: string;
  reason: string;
  operator: string;
  status: "active" | "pending" | "expired";
}

interface PriceFormData {
  fuelType: string;
  adjustmentType: "fixed" | "amount" | "percentage";
  newPrice: number;
  adjustmentValue: number;
  effectiveTime: string;
  reason: string;
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
    fuelType: "",
    changeType: "",
    dateRange: []
  }
});

const currentPrices = reactive<CurrentPrice[]>([
  { fuelType: "92#汽油", description: "国标92号汽油", currentPrice: 7.52, changeType: "up", changeAmount: "+0.15" },
  { fuelType: "95#汽油", description: "国标95号汽油", currentPrice: 8.01, changeType: "up", changeAmount: "+0.16" },
  { fuelType: "98#汽油", description: "国标98号汽油", currentPrice: 8.84, changeType: "up", changeAmount: "+0.18" },
  { fuelType: "0#柴油", description: "国标0号柴油", currentPrice: 7.15, changeType: "down", changeAmount: "-0.08" },
  { fuelType: "-10#柴油", description: "国标-10号柴油", currentPrice: 7.58, changeType: "same", changeAmount: "0.00" }
]);

const priceFormData = reactive<PriceFormData>({
  fuelType: "",
  adjustmentType: "fixed",
  newPrice: 0,
  adjustmentValue: 0,
  effectiveTime: "",
  reason: ""
});

const pagination = ref<Pagination>({
  showPageSize: true,
  showTotal: true,
  current: 1,
  pageSize: 10,
  total: 0
});

const loading = ref<boolean>(false);
const data = reactive<PriceHistoryData[]>([]);
const priceModalVisible = ref<boolean>(false);

const formRef = ref();
const priceFormRef = ref();

const columns = [
  {
    title: "油品类型",
    dataIndex: "fuelType",
    slotName: "fuelType",
    width: 120
  },
  {
    title: "价格变动",
    dataIndex: "priceChange",
    slotName: "priceChange",
    width: 180
  },
  {
    title: "生效时间",
    dataIndex: "effectiveTime",
    slotName: "effectiveTime",
    width: 150
  },
  {
    title: "调价原因",
    dataIndex: "reason",
    width: 200
  },
  {
    title: "操作员",
    dataIndex: "operator",
    width: 100
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
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

const getFuelTypeColor = (fuelType: string) => {
  const colorMap: Record<string, string> = {
    "92#汽油": "blue",
    "95#汽油": "green",
    "98#汽油": "purple",
    "0#柴油": "orange",
    "-10#柴油": "red"
  };
  return colorMap[fuelType] || "gray";
};

const getAdjustmentLabel = () => {
  switch (priceFormData.adjustmentType) {
    case "fixed":
      return "新价格(元/升)";
    case "amount":
      return "调价金额(元)";
    case "percentage":
      return "调价比例(%)";
    default:
      return "";
  }
};

const pageChange = (page: number) => {
  pagination.value.current = page;
  getPriceHistory();
};

const pageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  getPriceHistory();
};

const onReset = () => {
  formRef.value.resetFields();
  getPriceHistory();
};

const getPriceHistory = async () => {
  try {
    loading.value = true;
    const params = {
      ...formData.form,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    };
    const res = await getFuelPriceHistoryAPI(params);
    Object.assign(data, res.data.list);
    pagination.value.total = res.data.total;
  } finally {
    loading.value = false;
  }
};

const handlePriceAdjustment = () => {
  priceModalVisible.value = true;
};

const handleBatchPriceUpdate = () => {
  Message.info("批量调价功能开发中");
};

const handleExport = () => {
  Message.info("导出功能开发中");
};

const handleView = (record: PriceHistoryData) => {
  Message.info(`查看调价记录详情: ${record.id}`);
};

const handleEdit = (record: PriceHistoryData) => {
  Message.info(`编辑调价记录: ${record.id}`);
};

const handleCancel = async (record: PriceHistoryData) => {
  try {
    // 调用撤销调价API
    Message.success("调价记录已撤销");
    getPriceHistory();
  } catch (error) {
    Message.error("撤销失败");
  }
};

const handleSavePriceAdjustment = async () => {
  try {
    const valid = await priceFormRef.value.validate();
    if (!valid) return;

    await createPriceAdjustmentAPI(priceFormData);
    Message.success("调价设置成功");
    priceModalVisible.value = false;
    getPriceHistory();
  } catch (error) {
    Message.error("调价设置失败");
  }
};

const handleCancelPriceModal = () => {
  priceModalVisible.value = false;
  resetPriceForm();
};

const resetPriceForm = () => {
  Object.assign(priceFormData, {
    fuelType: "",
    adjustmentType: "fixed",
    newPrice: 0,
    adjustmentValue: 0,
    effectiveTime: "",
    reason: ""
  });
  priceFormRef.value?.resetFields();
};

onMounted(() => {
  getPriceHistory();
});
</script>

<style lang="scss" scoped>
.current-price-card {
  margin-bottom: 20px;

  .price-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border: 1px solid #e8edf5;
    border-radius: 8px;
    background: linear-gradient(135deg, #f8fafe, #ffffff);

    .fuel-info {
      .fuel-type {
        font-size: 16px;
        font-weight: 600;
        color: #1b2a3e;
        margin-bottom: 4px;
      }

      .fuel-desc {
        font-size: 12px;
        color: #8492a6;
      }
    }

    .price-info {
      text-align: right;

      .current-price {
        font-size: 18px;
        font-weight: 600;
        color: #0094ff;
        margin-bottom: 4px;
      }

      .price-change {
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 2px;

        &.up {
          color: #fa4f4f;
        }

        &.down {
          color: #0abf5a;
        }

        &.same {
          color: #8492a6;
        }
      }
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

.price-change-cell {
  .price-display {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .old-price {
      color: #8492a6;
      text-decoration: line-through;
    }

    .arrow {
      color: #8492a6;
    }

    .new-price {
      color: #1b2a3e;
      font-weight: 600;
    }
  }

  .change-amount {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 2px;

    &.up {
      color: #fa4f4f;
    }

    &.down {
      color: #0abf5a;
    }

    &.same {
      color: #8492a6;
    }
  }
}

.time-cell {
  .effect-time {
    font-size: 14px;
    color: #1b2a3e;
    margin-bottom: 4px;
  }

  .status {
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;

    &.active {
      color: #0abf5a;
      background: #e6f7ed;
    }

    &.pending {
      color: #f29324;
      background: #fff7e6;
    }

    &.expired {
      color: #8492a6;
      background: #f4f7f9;
    }
  }
}

:deep(.arco-card-header) {
  border-bottom: 1px solid #e8edf5;
}

:deep(.arco-table-cell) {
  padding: 12px;
}
</style>
