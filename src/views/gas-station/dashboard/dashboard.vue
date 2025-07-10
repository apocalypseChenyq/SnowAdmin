<template>
  <div class="snow-page">
    <div class="gas-station-dashboard">
      <!-- 关键指标卡片 -->
      <div class="metrics-cards">
        <a-row :gutter="20">
          <a-col :xs="24" :sm="12" :md="6" :lg="6">
            <a-card class="metric-card" :bordered="false">
              <div class="metric-content">
                <div class="metric-icon total-stations">
                  <icon-home />
                </div>
                <div class="metric-info">
                  <div class="metric-value">{{ statistics.totalStations }}</div>
                  <div class="metric-label">总加油站数</div>
                </div>
              </div>
              <div class="metric-trend">
                <span class="trend-up">
                  <icon-arrow-up />
                  {{ statistics.stationGrowth }}%
                </span>
                较上月
              </div>
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6" :lg="6">
            <a-card class="metric-card" :bordered="false">
              <div class="metric-content">
                <div class="metric-icon daily-revenue">
                  <icon-dollar />
                </div>
                <div class="metric-info">
                  <div class="metric-value">¥{{ statistics.dailyRevenue.toLocaleString() }}</div>
                  <div class="metric-label">今日营业额</div>
                </div>
              </div>
              <div class="metric-trend">
                <span class="trend-up">
                  <icon-arrow-up />
                  {{ statistics.revenueGrowth }}%
                </span>
                较昨日
              </div>
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6" :lg="6">
            <a-card class="metric-card" :bordered="false">
              <div class="metric-content">
                <div class="metric-icon fuel-volume">
                  <icon-thunderbolt />
                </div>
                <div class="metric-info">
                  <div class="metric-value">{{ statistics.fuelVolume.toLocaleString() }}L</div>
                  <div class="metric-label">今日销量</div>
                </div>
              </div>
              <div class="metric-trend">
                <span class="trend-up">
                  <icon-arrow-up />
                  {{ statistics.volumeGrowth }}%
                </span>
                较昨日
              </div>
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6" :lg="6">
            <a-card class="metric-card" :bordered="false">
              <div class="metric-content">
                <div class="metric-icon active-customers">
                  <icon-user />
                </div>
                <div class="metric-info">
                  <div class="metric-value">{{ statistics.activeCustomers.toLocaleString() }}</div>
                  <div class="metric-label">活跃用户</div>
                </div>
              </div>
              <div class="metric-trend">
                <span class="trend-down">
                  <icon-arrow-down />
                  {{ statistics.customerGrowth }}%
                </span>
                较昨日
              </div>
            </a-card>
          </a-col>
        </a-row>
      </div>

      <!-- 图表区域 -->
      <a-row :gutter="20" class="chart-section">
        <a-col :xs="24" :lg="16">
          <a-card title="营业额趋势" :bordered="false" class="chart-card">
            <div ref="revenueChart" class="chart-container"></div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="8">
          <a-card title="油品销售占比" :bordered="false" class="chart-card">
            <div ref="fuelChart" class="chart-container-small"></div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 实时数据 -->
      <a-row :gutter="20" class="realtime-section">
        <a-col :xs="24" :lg="12">
          <a-card title="今日实时数据" :bordered="false">
            <div class="realtime-item" v-for="item in realtimeData" :key="item.station">
              <div class="station-info">
                <div class="station-name">{{ item.station }}</div>
                <div class="station-status" :class="item.status">
                  {{ item.status === "online" ? "营业中" : "离线" }}
                </div>
              </div>
              <div class="station-metrics">
                <div class="metric">
                  <span class="label">销量:</span>
                  <span class="value">{{ item.volume }}L</span>
                </div>
                <div class="metric">
                  <span class="label">营业额:</span>
                  <span class="value">¥{{ item.revenue.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12">
          <a-card title="设备状态监控" :bordered="false">
            <div class="equipment-status">
              <div class="status-item" v-for="equipment in equipmentStatus" :key="equipment.id">
                <div class="equipment-info">
                  <div class="equipment-name">{{ equipment.name }}</div>
                  <div class="equipment-location">{{ equipment.location }}</div>
                </div>
                <a-tag :color="getStatusColor(equipment.status)" size="small">
                  {{ equipment.status }}
                </a-tag>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 快捷操作 -->
      <a-card title="快捷操作" :bordered="false" class="quick-actions">
        <a-row :gutter="16">
          <a-col :xs="12" :sm="6" :md="4" v-for="action in quickActions" :key="action.key">
            <div class="action-item" @click="handleQuickAction(action.key)">
              <div class="action-icon" :style="{ backgroundColor: action.color }">
                <component :is="action.icon" />
              </div>
              <div class="action-label">{{ action.label }}</div>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import { Message } from "@arco-design/web-vue";

interface Statistics {
  totalStations: number;
  stationGrowth: number;
  dailyRevenue: number;
  revenueGrowth: number;
  fuelVolume: number;
  volumeGrowth: number;
  activeCustomers: number;
  customerGrowth: number;
}

interface RealtimeData {
  station: string;
  status: "online" | "offline";
  volume: number;
  revenue: number;
}

interface EquipmentStatus {
  id: string;
  name: string;
  location: string;
  status: "正常" | "故障" | "维护中";
}

interface QuickAction {
  key: string;
  label: string;
  icon: string;
  color: string;
}

const statistics = reactive<Statistics>({
  totalStations: 42,
  stationGrowth: 5.2,
  dailyRevenue: 1268500,
  revenueGrowth: 8.7,
  fuelVolume: 45680,
  volumeGrowth: 3.4,
  activeCustomers: 1523,
  customerGrowth: -2.1
});

const realtimeData = reactive<RealtimeData[]>([
  { station: "北京朝阳1号站", status: "online", volume: 3250, revenue: 28500 },
  { station: "上海浦东2号站", status: "online", volume: 4180, revenue: 35200 },
  { station: "广州天河3号站", status: "online", volume: 2890, revenue: 24300 },
  { station: "深圳南山4号站", status: "offline", volume: 0, revenue: 0 },
  { station: "杭州西湖5号站", status: "online", volume: 3650, revenue: 31200 }
]);

const equipmentStatus = reactive<EquipmentStatus[]>([
  { id: "1", name: "1号油枪", location: "北京朝阳1号站", status: "正常" },
  { id: "2", name: "2号油枪", location: "北京朝阳1号站", status: "正常" },
  { id: "3", name: "3号油枪", location: "上海浦东2号站", status: "维护中" },
  { id: "4", name: "储油罐A", location: "广州天河3号站", status: "正常" },
  { id: "5", name: "储油罐B", location: "深圳南山4号站", status: "故障" },
  { id: "6", name: "支付终端", location: "杭州西湖5号站", status: "正常" }
]);

const quickActions = reactive<QuickAction[]>([
  { key: "add-station", label: "新增站点", icon: "icon-plus", color: "#0094ff" },
  { key: "fuel-price", label: "油价管理", icon: "icon-dollar", color: "#f29324" },
  { key: "inventory", label: "库存管理", icon: "icon-storage", color: "#0abf5a" },
  { key: "reports", label: "营业报表", icon: "icon-file", color: "#722ed1" },
  { key: "maintenance", label: "设备维护", icon: "icon-tool", color: "#fa4f4f" },
  { key: "staff", label: "员工管理", icon: "icon-user-group", color: "#13c2c2" }
]);

const revenueChart = ref();
const fuelChart = ref();

const getStatusColor = (status: string) => {
  switch (status) {
    case "正常":
      return "green";
    case "故障":
      return "red";
    case "维护中":
      return "orange";
    default:
      return "gray";
  }
};

const handleQuickAction = (key: string) => {
  switch (key) {
    case "add-station":
      Message.info("跳转到新增站点页面");
      break;
    case "fuel-price":
      Message.info("跳转到油价管理页面");
      break;
    case "inventory":
      Message.info("跳转到库存管理页面");
      break;
    case "reports":
      Message.info("跳转到营业报表页面");
      break;
    case "maintenance":
      Message.info("跳转到设备维护页面");
      break;
    case "staff":
      Message.info("跳转到员工管理页面");
      break;
    default:
      Message.info("功能开发中...");
  }
};

const initCharts = () => {
  // 这里可以集成 VChart 或其他图表库
  // 由于项目已经有 VChart 依赖，可以在这里初始化图表
  Message.info("图表功能开发中，请集成 VChart 来展示数据图表");
};

const updateRealtimeData = () => {
  // 模拟实时数据更新
  realtimeData.forEach(item => {
    if (item.status === "online") {
      item.volume += Math.floor(Math.random() * 50);
      item.revenue += Math.floor(Math.random() * 500);
    }
  });
};

onMounted(() => {
  initCharts();

  // 每30秒更新一次实时数据
  setInterval(updateRealtimeData, 30000);
});
</script>

<style lang="scss" scoped>
.gas-station-dashboard {
  padding: 20px;
  background: $color-bg-1;
}

.metrics-cards {
  margin-bottom: 20px;
}

.metric-card {
  height: 120px;
  .metric-content {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .metric-icon {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      font-size: 24px;
      color: white;

      &.total-stations {
        background: linear-gradient(135deg, #0094ff, #00d4ff);
      }

      &.daily-revenue {
        background: linear-gradient(135deg, #f29324, #ffba00);
      }

      &.fuel-volume {
        background: linear-gradient(135deg, #0abf5a, #00e676);
      }

      &.active-customers {
        background: linear-gradient(135deg, #722ed1, #b37feb);
      }
    }

    .metric-info {
      .metric-value {
        font-size: 24px;
        font-weight: 600;
        color: #1b2a3e;
        line-height: 1;
        margin-bottom: 4px;
      }

      .metric-label {
        font-size: 14px;
        color: #8492a6;
      }
    }
  }

  .metric-trend {
    font-size: 12px;
    color: #8492a6;

    .trend-up {
      color: #0abf5a;
      margin-right: 4px;
    }

    .trend-down {
      color: #fa4f4f;
      margin-right: 4px;
    }
  }
}

.chart-section {
  margin-bottom: 20px;

  .chart-card {
    height: 400px;
  }

  .chart-container {
    height: 320px;
    background: #f8fafe;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8492a6;
  }

  .chart-container-small {
    height: 320px;
    background: #f8fafe;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8492a6;
  }
}

.realtime-section {
  margin-bottom: 20px;
}

.realtime-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e8edf5;

  &:last-child {
    border-bottom: none;
  }

  .station-info {
    .station-name {
      font-weight: 500;
      color: #1b2a3e;
      margin-bottom: 4px;
    }

    .station-status {
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;

      &.online {
        color: #0abf5a;
        background: #e6f7ed;
      }

      &.offline {
        color: #fa4f4f;
        background: #ffeded;
      }
    }
  }

  .station-metrics {
    text-align: right;

    .metric {
      margin-bottom: 4px;
      font-size: 12px;

      .label {
        color: #8492a6;
        margin-right: 4px;
      }

      .value {
        color: #1b2a3e;
        font-weight: 500;
      }
    }
  }
}

.equipment-status {
  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #e8edf5;

    &:last-child {
      border-bottom: none;
    }

    .equipment-info {
      .equipment-name {
        font-weight: 500;
        color: #1b2a3e;
        margin-bottom: 4px;
      }

      .equipment-location {
        font-size: 12px;
        color: #8492a6;
      }
    }
  }
}

.quick-actions {
  .action-item {
    text-align: center;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 8px;

    &:hover {
      background: #f8fafe;
      transform: translateY(-2px);
    }

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
      font-size: 20px;
      color: white;
    }

    .action-label {
      font-size: 14px;
      color: #1b2a3e;
      font-weight: 500;
    }
  }
}

:deep(.arco-card-header) {
  border-bottom: 1px solid #e8edf5;
  padding: 16px 20px;
}

:deep(.arco-card-body) {
  padding: 20px;
}
</style>
