<template>
  <div class="snow-page">
    <div class="snow-inner">
      <!-- 订单概览统计 -->
      <a-row :gutter="20" class="order-stats">
        <a-col :xs="24" :sm="12" :md="6" v-for="stat in orderStats" :key="stat.key">
          <a-card class="stat-card" :bordered="false">
            <div class="stat-content">
              <div class="stat-icon" :class="stat.iconClass">
                <component :is="stat.icon" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
                <div class="stat-trend" :class="stat.trendType">
                  <icon-arrow-up v-if="stat.trendType === 'up'" />
                  <icon-arrow-down v-if="stat.trendType === 'down'" />
                  {{ stat.trend }}
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 搜索筛选 -->
      <a-form ref="formRef" auto-label-width :model="formData.form" class="search-form">
        <a-row :gutter="16">
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item field="orderNo" label="订单号">
              <a-input v-model="formData.form.orderNo" placeholder="请输入订单号" allow-clear />
            </a-form-item>
          </a-col>
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
            <a-form-item field="paymentMethod" label="支付方式">
              <a-select v-model="formData.form.paymentMethod" placeholder="请选择支付方式" allow-clear>
                <a-option value="cash">现金</a-option>
                <a-option value="wechat">微信支付</a-option>
                <a-option value="alipay">支付宝</a-option>
                <a-option value="card">银行卡</a-option>
                <a-option value="member">会员卡</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item field="orderStatus" label="订单状态">
              <a-select v-model="formData.form.orderStatus" placeholder="请选择订单状态" allow-clear>
                <a-option value="completed">已完成</a-option>
                <a-option value="pending">进行中</a-option>
                <a-option value="cancelled">已取消</a-option>
                <a-option value="refunded">已退款</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item field="dateRange" label="交易时间">
              <a-range-picker v-model="formData.form.dateRange" format="YYYY-MM-DD" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-space class="search-btn">
              <a-button type="primary" @click="getOrderList">
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
          <a-button type="primary" @click="handleCreateOrder">
            <template #icon>
              <icon-plus />
            </template>
            新建订单
          </a-button>
          <a-button type="outline" @click="handleBatchRefund">
            <template #icon>
              <icon-undo />
            </template>
            批量退款
          </a-button>
          <a-button type="outline" @click="handleExport">
            <template #icon>
              <icon-download />
            </template>
            导出订单
          </a-button>
        </a-space>
      </div>

      <!-- 订单列表 -->
      <a-table
        row-key="id"
        size="small"
        :bordered="{ cell: true }"
        :scroll="{ x: '100%', y: '100%', minWidth: 1400 }"
        :loading="loading"
        :columns="columns"
        :data="data"
        :pagination="pagination"
        :row-selection="rowSelection"
        @page-change="pageChange"
        @page-size-change="pageSizeChange"
      >
        <template #orderNo="{ record }">
          <a-link @click="handleViewOrder(record)">{{ record.orderNo }}</a-link>
        </template>
        <template #fuelType="{ record }">
          <a-tag :color="getFuelTypeColor(record.fuelType)" size="small">
            {{ record.fuelType }}
          </a-tag>
        </template>
        <template #paymentMethod="{ record }">
          <div class="payment-method">
            <component :is="getPaymentIcon(record.paymentMethod)" />
            <span>{{ getPaymentMethodText(record.paymentMethod) }}</span>
          </div>
        </template>
        <template #orderStatus="{ record }">
          <a-tag :color="getOrderStatusColor(record.orderStatus)" size="small">
            {{ getOrderStatusText(record.orderStatus) }}
          </a-tag>
        </template>
        <template #totalAmount="{ record }">
          <span class="amount-text">¥{{ record.totalAmount.toFixed(2) }}</span>
        </template>
        <template #optional="{ record }">
          <a-space>
            <a-button size="mini" type="primary" @click="handleViewOrder(record)">详情</a-button>
            <a-dropdown @select="(value: string) => handleDropdownAction(value, record)">
              <a-button size="mini" type="outline">
                更多
                <icon-down />
              </a-button>
              <template #content>
                <a-doption value="refund" v-if="record.orderStatus === 'completed'">
                  <template #icon>
                    <icon-undo />
                  </template>
                  退款
                </a-doption>
                <a-doption value="cancel" v-if="record.orderStatus === 'pending'">
                  <template #icon>
                    <icon-close />
                  </template>
                  取消订单
                </a-doption>
                <a-doption value="print">
                  <template #icon>
                    <icon-printer />
                  </template>
                  打印小票
                </a-doption>
                <a-doption value="resend">
                  <template #icon>
                    <icon-send />
                  </template>
                  重发短信
                </a-doption>
              </template>
            </a-dropdown>
          </a-space>
        </template>
      </a-table>
    </div>

    <!-- 订单详情弹窗 -->
    <a-modal v-model:visible="orderDetailVisible" title="订单详情" width="800px" :footer="false">
      <div class="order-detail" v-if="selectedOrder">
        <a-descriptions :column="2" :bordered="true">
          <a-descriptions-item label="订单号">{{ selectedOrder.orderNo }}</a-descriptions-item>
          <a-descriptions-item label="交易时间">{{ selectedOrder.orderTime }}</a-descriptions-item>
          <a-descriptions-item label="加油站">{{ selectedOrder.stationName }}</a-descriptions-item>
          <a-descriptions-item label="油枪号">{{ selectedOrder.gunNo }}</a-descriptions-item>
          <a-descriptions-item label="油品类型">
            <a-tag :color="getFuelTypeColor(selectedOrder.fuelType)" size="small">
              {{ selectedOrder.fuelType }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="加油量">{{ selectedOrder.volume }}L</a-descriptions-item>
          <a-descriptions-item label="单价">¥{{ selectedOrder.unitPrice }}/L</a-descriptions-item>
          <a-descriptions-item label="总金额">
            <span class="amount-text">¥{{ selectedOrder.totalAmount.toFixed(2) }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="支付方式">
            <div class="payment-method">
              <component :is="getPaymentIcon(selectedOrder.paymentMethod)" />
              <span>{{ getPaymentMethodText(selectedOrder.paymentMethod) }}</span>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="订单状态">
            <a-tag :color="getOrderStatusColor(selectedOrder.orderStatus)" size="small">
              {{ getOrderStatusText(selectedOrder.orderStatus) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="操作员">{{ selectedOrder.operator }}</a-descriptions-item>
          <a-descriptions-item label="备注" v-if="selectedOrder.remark">{{ selectedOrder.remark }}</a-descriptions-item>
        </a-descriptions>

        <div class="order-actions" v-if="selectedOrder.orderStatus !== 'cancelled'">
          <a-space>
            <a-button type="primary" @click="handlePrintReceipt(selectedOrder)">
              <template #icon>
                <icon-printer />
              </template>
              打印小票
            </a-button>
            <a-button type="outline" @click="handleRefundOrder(selectedOrder)" v-if="selectedOrder.orderStatus === 'completed'">
              <template #icon>
                <icon-undo />
              </template>
              申请退款
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Message } from "@arco-design/web-vue";
import { getOrderListAPI, refundOrderAPI } from "@/api/modules/gas-station/index";

interface FormData {
  form: {
    orderNo: string;
    stationId: string;
    paymentMethod: string;
    orderStatus: string;
    dateRange: string[];
  };
}

interface OrderStats {
  key: string;
  label: string;
  value: string;
  icon: string;
  iconClass: string;
  trend: string;
  trendType: "up" | "down" | "stable";
}

interface Order {
  id: string;
  orderNo: string;
  stationName: string;
  gunNo: string;
  fuelType: string;
  volume: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: "cash" | "wechat" | "alipay" | "card" | "member";
  orderStatus: "completed" | "pending" | "cancelled" | "refunded";
  operator: string;
  orderTime: string;
  remark?: string;
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
    orderNo: "",
    stationId: "",
    paymentMethod: "",
    orderStatus: "",
    dateRange: []
  }
});

const orderStats = reactive<OrderStats[]>([
  {
    key: "todayOrders",
    label: "今日订单",
    value: "1,234",
    icon: "icon-file-text",
    iconClass: "stat-blue",
    trend: "+12.3%",
    trendType: "up"
  },
  {
    key: "todayAmount",
    label: "今日营业额",
    value: "¥89,567",
    icon: "icon-dollar",
    iconClass: "stat-green",
    trend: "+8.6%",
    trendType: "up"
  },
  {
    key: "memberOrders",
    label: "会员订单",
    value: "856",
    icon: "icon-user",
    iconClass: "stat-purple",
    trend: "+15.2%",
    trendType: "up"
  },
  {
    key: "refundAmount",
    label: "退款金额",
    value: "¥2,345",
    icon: "icon-undo",
    iconClass: "stat-orange",
    trend: "-2.1%",
    trendType: "down"
  }
]);

const pagination = ref<Pagination>({
  showPageSize: true,
  showTotal: true,
  current: 1,
  pageSize: 10,
  total: 0
});

const rowSelection = reactive({
  type: "checkbox",
  showCheckedAll: true
});

const loading = ref<boolean>(false);
const data = reactive<Order[]>([]);
const orderDetailVisible = ref<boolean>(false);
const selectedOrder = ref<Order | null>(null);

const formRef = ref();

const columns = [
  {
    title: "订单号",
    dataIndex: "orderNo",
    slotName: "orderNo",
    width: 180
  },
  {
    title: "加油站",
    dataIndex: "stationName",
    width: 150
  },
  {
    title: "油枪号",
    dataIndex: "gunNo",
    width: 80
  },
  {
    title: "油品类型",
    dataIndex: "fuelType",
    slotName: "fuelType",
    width: 100
  },
  {
    title: "加油量(L)",
    dataIndex: "volume",
    width: 100
  },
  {
    title: "单价(元/L)",
    dataIndex: "unitPrice",
    width: 100
  },
  {
    title: "总金额",
    dataIndex: "totalAmount",
    slotName: "totalAmount",
    width: 100
  },
  {
    title: "支付方式",
    dataIndex: "paymentMethod",
    slotName: "paymentMethod",
    width: 120
  },
  {
    title: "订单状态",
    dataIndex: "orderStatus",
    slotName: "orderStatus",
    width: 100
  },
  {
    title: "操作员",
    dataIndex: "operator",
    width: 100
  },
  {
    title: "交易时间",
    dataIndex: "orderTime",
    width: 150
  },
  {
    title: "操作",
    slotName: "optional",
    align: "center",
    fixed: "right",
    width: 150
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

const getPaymentIcon = (method: string) => {
  const iconMap: Record<string, string> = {
    cash: "icon-wallet",
    wechat: "icon-wechat",
    alipay: "icon-alipay",
    card: "icon-credit-card",
    member: "icon-user"
  };
  return iconMap[method] || "icon-wallet";
};

const getPaymentMethodText = (method: string) => {
  const textMap: Record<string, string> = {
    cash: "现金",
    wechat: "微信支付",
    alipay: "支付宝",
    card: "银行卡",
    member: "会员卡"
  };
  return textMap[method] || "未知";
};

const getOrderStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    completed: "green",
    pending: "orange",
    cancelled: "red",
    refunded: "purple"
  };
  return colorMap[status] || "gray";
};

const getOrderStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    completed: "已完成",
    pending: "进行中",
    cancelled: "已取消",
    refunded: "已退款"
  };
  return textMap[status] || "未知";
};

const pageChange = (page: number) => {
  pagination.value.current = page;
  getOrderList();
};

const pageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize;
  getOrderList();
};

const onReset = () => {
  formRef.value.resetFields();
  getOrderList();
};

const getOrderList = async () => {
  try {
    loading.value = true;
    const params = {
      ...formData.form,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    };
    const res = await getOrderListAPI(params);
    Object.assign(data, res.data.list);
    pagination.value.total = res.data.total;
  } finally {
    loading.value = false;
  }
};

const handleCreateOrder = () => {
  Message.info("新建订单功能开发中");
};

const handleBatchRefund = () => {
  Message.info("批量退款功能开发中");
};

const handleExport = () => {
  Message.info("导出功能开发中");
};

const handleViewOrder = (order: Order) => {
  selectedOrder.value = order;
  orderDetailVisible.value = true;
};

const handleDropdownAction = (action: string, order: Order) => {
  switch (action) {
    case "refund":
      handleRefundOrder(order);
      break;
    case "cancel":
      handleCancelOrder(order);
      break;
    case "print":
      handlePrintReceipt(order);
      break;
    case "resend":
      handleResendSMS(order);
      break;
  }
};

const handleRefundOrder = async (order: Order) => {
  try {
    await refundOrderAPI(order.id);
    Message.success("退款申请已提交");
    getOrderList();
  } catch (error) {
    Message.error("退款申请失败");
  }
};

const handleCancelOrder = (order: Order) => {
  Message.info(`取消订单: ${order.orderNo}`);
};

const handlePrintReceipt = (order: Order) => {
  Message.info(`打印小票: ${order.orderNo}`);
};

const handleResendSMS = (order: Order) => {
  Message.info(`重发短信: ${order.orderNo}`);
};

onMounted(() => {
  getOrderList();
});
</script>

<style lang="scss" scoped>
.order-stats {
  margin-bottom: 20px;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;

      &.stat-blue {
        background: linear-gradient(135deg, #0094ff, #80c9ff);
        color: white;
      }

      &.stat-green {
        background: linear-gradient(135deg, #0abf5a, #7dd3fc);
        color: white;
      }

      &.stat-purple {
        background: linear-gradient(135deg, #722ed1, #d1a3ff);
        color: white;
      }

      &.stat-orange {
        background: linear-gradient(135deg, #f29324, #ffc168);
        color: white;
      }
    }

    .stat-info {
      flex: 1;

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #1b2a3e;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 14px;
        color: #8492a6;
        margin-bottom: 4px;
      }

      .stat-trend {
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 2px;

        &.up {
          color: #0abf5a;
        }

        &.down {
          color: #fa4f4f;
        }

        &.stable {
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

.payment-method {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.amount-text {
  font-weight: 600;
  color: #0094ff;
}

.order-detail {
  .order-actions {
    margin-top: 20px;
    text-align: center;
  }
}

:deep(.arco-card-header) {
  border-bottom: 1px solid #e8edf5;
}

:deep(.arco-card-body) {
  padding: 20px;
}

:deep(.arco-descriptions-item-label) {
  background: #f8fafe;
  font-weight: 500;
}
</style>
