<template>
  <div class="snow-page">
    <div class="snow-inner">
      <!-- 账户余额 -->
      <div class="account-balance">
        <div class="balance-label">
          <span>账户余额</span>
          <icon-question-circle class="help-icon" />
        </div>
        <div class="balance-amount">¥{{ accountBalance.toLocaleString() }}</div>
        <icon-right class="arrow-icon" />
      </div>

      <!-- 关键指标 -->
      <a-row :gutter="20" class="key-metrics">
        <a-col :xs="24" :sm="8" v-for="metric in keyMetrics" :key="metric.key">
          <a-card class="metric-card" :bordered="false">
            <div class="metric-content">
              <div class="metric-header">
                <span class="metric-label">{{ metric.label }}</span>
                <icon-question-circle class="help-icon" />
                <a-link class="detail-link">详情</a-link>
              </div>
              <div class="metric-value">¥{{ metric.value.toLocaleString() }}</div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 快捷功能 -->
      <div class="quick-actions">
        <a-row :gutter="[20, 20]">
          <a-col :xs="12" :sm="8" :md="6" v-for="action in quickActions" :key="action.key">
            <div class="action-card" @click="handleQuickAction(action.key)">
              <div class="action-icon" :style="{ backgroundColor: action.color }">
                <component :is="action.icon" />
              </div>
              <div class="action-content">
                <div class="action-title">{{ action.title }}</div>
                <div class="action-desc">{{ action.description }}</div>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- 油品价格趋势 -->
      <a-card title="油品价格趋势" :bordered="false" class="price-trend-card">
        <template #extra>
          <a-space>
            <icon-line-chart />
            <icon-bar-chart />
          </a-space>
        </template>

        <!-- 筛选条件 -->
        <div class="trend-filters">
          <a-space>
            <a-select v-model="priceFilters.region" style="width: 120px" placeholder="全国">
              <a-option value="all">全国</a-option>
              <a-option value="north">华北</a-option>
              <a-option value="south">华南</a-option>
              <a-option value="east">华东</a-option>
            </a-select>
            <a-select v-model="priceFilters.fuelType" style="width: 120px" placeholder="油品不限">
              <a-option value="all">油品不限</a-option>
              <a-option value="92#汽油">92#汽油</a-option>
              <a-option value="0#柴油">0#柴油</a-option>
              <a-option value="天然气">天然气</a-option>
            </a-select>
            <a-range-picker v-model="priceFilters.dateRange" format="YYYY/MM/DD" />
            <a-button type="primary">查询</a-button>
            <a-button type="outline">重置</a-button>
          </a-space>
        </div>

        <!-- 价格图表 -->
        <div class="price-chart" ref="chartContainer">
          <div class="chart-placeholder">
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-dot" style="background-color: #3491fa"></span>
                <span>0号柴油</span>
                <span class="legend-value">¥6.5</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background-color: #ff7d00"></span>
                <span>92号汽油</span>
                <span class="legend-value">¥6.5</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background-color: #00d0ff"></span>
                <span>天然气</span>
                <span class="legend-value">¥6.5</span>
              </div>
            </div>

            <!-- 模拟价格趋势图 -->
            <div class="mock-chart">
              <svg width="100%" height="300" viewBox="0 0 800 300">
                <!-- 网格线 -->
                <defs>
                  <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f0f0f0" stroke-width="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                <!-- Y轴标签 -->
                <g class="y-axis">
                  <text x="30" y="50" class="axis-label">7.75</text>
                  <text x="30" y="80" class="axis-label">7.5</text>
                  <text x="30" y="110" class="axis-label">7.25</text>
                  <text x="30" y="140" class="axis-label">7.00</text>
                  <text x="30" y="170" class="axis-label">6.75</text>
                  <text x="30" y="200" class="axis-label">6.50</text>
                  <text x="30" y="230" class="axis-label">6.25</text>
                  <text x="30" y="260" class="axis-label">6.0</text>
                </g>

                <!-- X轴标签 -->
                <g class="x-axis">
                  <text x="80" y="290" class="axis-label">1:00</text>
                  <text x="160" y="290" class="axis-label">3:00</text>
                  <text x="240" y="290" class="axis-label">5:00</text>
                  <text x="320" y="290" class="axis-label">7:00</text>
                  <text x="400" y="290" class="axis-label">9:00</text>
                  <text x="480" y="290" class="axis-label">11:00</text>
                  <text x="560" y="290" class="axis-label">13:00</text>
                  <text x="640" y="290" class="axis-label">15:00</text>
                  <text x="720" y="290" class="axis-label">17:00</text>
                </g>

                <!-- 0号柴油价格线 -->
                <polyline
                  fill="none"
                  stroke="#3491FA"
                  stroke-width="2"
                  points="60,180 120,175 180,172 240,174 300,170 360,168 420,172 480,175 540,170 600,168 660,172 720,175"
                />

                <!-- 92号汽油价格线 -->
                <polyline
                  fill="none"
                  stroke="#FF7D00"
                  stroke-width="2"
                  points="60,140 120,138 180,135 240,140 300,145 360,142 420,140 480,138 540,135 600,140 660,142 720,145"
                />

                <!-- 天然气价格线 -->
                <polyline
                  fill="none"
                  stroke="#00D0FF"
                  stroke-width="2"
                  points="60,200 120,195 180,198 240,200 300,205 360,202 420,200 480,195 540,198 600,202 660,200 720,198"
                />
              </svg>
            </div>

            <!-- 底部图例 -->
            <div class="chart-bottom-legend">
              <div class="legend-item">
                <span class="legend-dot" style="background-color: #3491fa"></span>
                <span>0号柴油</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background-color: #ff7d00"></span>
                <span>92号汽油</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background-color: #00d0ff"></span>
                <span>天然气</span>
              </div>
            </div>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Message } from "@arco-design/web-vue";

interface KeyMetric {
  key: string;
  label: string;
  value: number;
}

interface QuickAction {
  key: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface PriceFilters {
  region: string;
  fuelType: string;
  dateRange: string[];
}

const accountBalance = ref<number>(2457889.0);

const keyMetrics = reactive<KeyMetric[]>([
  { key: "operating", label: "营运中金额", value: 208765.97 },
  { key: "monthlyConsume", label: "当月司机消费金额", value: 208765.97 },
  { key: "unconsumed", label: "司机未消费金额", value: 208765.97 }
]);

const quickActions = reactive<QuickAction[]>([
  {
    key: "driverManagement",
    title: "司机账户管理",
    description: "新建司机、司机账户充值/回收",
    icon: "icon-user",
    color: "#FF6B6B"
  },
  {
    key: "fundFlow",
    title: "资金流水",
    description: "司机&机构流水",
    icon: "icon-fund",
    color: "#4ECDC4"
  },
  {
    key: "consumeRecord",
    title: "消费记录",
    description: "司机加油消费订单",
    icon: "icon-file-text",
    color: "#FFE66D"
  },
  {
    key: "allocationRecord",
    title: "分配记录",
    description: "司机充值分润记录",
    icon: "icon-share-alt",
    color: "#95E1D3"
  },
  {
    key: "invoiceManagement",
    title: "企业发票管理",
    description: "申请开票、查看发票",
    icon: "icon-file",
    color: "#6C5CE7"
  },
  {
    key: "fuelAudit",
    title: "分油审核",
    description: "方便、快捷、高效",
    icon: "icon-check-circle",
    color: "#FDCB6E"
  },
  {
    key: "transferAudit",
    title: "转账审核",
    description: "资金安全实时到账",
    icon: "icon-safe",
    color: "#6C5CE7"
  }
]);

const priceFilters = reactive<PriceFilters>({
  region: "all",
  fuelType: "all",
  dateRange: []
});

const chartContainer = ref();

const handleQuickAction = (actionKey: string) => {
  const actionMap: Record<string, string> = {
    driverManagement: "司机账户管理",
    fundFlow: "资金流水",
    consumeRecord: "消费记录",
    allocationRecord: "分配记录",
    invoiceManagement: "企业发票管理",
    fuelAudit: "分油审核",
    transferAudit: "转账审核"
  };

  Message.info(`跳转到${actionMap[actionKey]}页面`);
};

onMounted(() => {
  // 这里可以初始化真实的图表库，比如 VChart、ECharts 等
  console.log("页面加载完成，可以初始化图表");
});
</script>

<style lang="scss" scoped>
.account-balance {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  position: relative;

  .balance-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    margin-bottom: 8px;

    .help-icon {
      font-size: 14px;
      opacity: 0.8;
    }
  }

  .balance-amount {
    font-size: 32px;
    font-weight: 700;
    flex: 1;
  }

  .arrow-icon {
    font-size: 20px;
    opacity: 0.8;
  }
}

.key-metrics {
  margin-bottom: 30px;
}

.metric-card {
  .metric-content {
    .metric-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .metric-label {
        font-size: 14px;
        color: #8492a6;
        flex: 1;
      }

      .help-icon {
        font-size: 12px;
        color: #c0cbda;
      }

      .detail-link {
        font-size: 12px;
        color: #0094ff;
      }
    }

    .metric-value {
      font-size: 24px;
      font-weight: 600;
      color: #1b2a3e;
    }
  }
}

.quick-actions {
  margin-bottom: 30px;
}

.action-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e8edf5;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 148, 255, 0.12);
    border-color: #0094ff;
  }

  .action-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    flex-shrink: 0;
  }

  .action-content {
    flex: 1;

    .action-title {
      font-size: 16px;
      font-weight: 600;
      color: #1b2a3e;
      margin-bottom: 4px;
    }

    .action-desc {
      font-size: 12px;
      color: #8492a6;
      line-height: 1.4;
    }
  }
}

.price-trend-card {
  .trend-filters {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e8edf5;
  }

  .price-chart {
    .chart-placeholder {
      .chart-legend {
        display: flex;
        gap: 24px;
        margin-bottom: 16px;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;

          .legend-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }

          .legend-value {
            color: #8492a6;
          }
        }
      }

      .mock-chart {
        margin-bottom: 16px;

        .axis-label {
          font-size: 12px;
          fill: #8492a6;
        }
      }

      .chart-bottom-legend {
        display: flex;
        justify-content: center;
        gap: 32px;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #8492a6;

          .legend-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
          }
        }
      }
    }
  }
}

:deep(.arco-card-header) {
  border-bottom: 1px solid #e8edf5;
  padding: 20px 24px 16px;
}

:deep(.arco-card-body) {
  padding: 20px 24px;
}

@media (max-width: 768px) {
  .account-balance {
    flex-direction: column;
    align-items: flex-start;

    .balance-amount {
      font-size: 24px;
    }
  }

  .action-card {
    padding: 16px;

    .action-icon {
      width: 40px;
      height: 40px;
      font-size: 18px;
    }

    .action-content {
      .action-title {
        font-size: 14px;
      }

      .action-desc {
        font-size: 11px;
      }
    }
  }

  .chart-legend {
    flex-direction: column !important;
    gap: 12px !important;
  }
}
</style>
