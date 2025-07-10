import { MockMethod } from "vite-plugin-mock";
import Mock from "mockjs";

// 生成模拟数据的工具函数
const generateStationData = (count: number) => {
  const brands = ["中石油", "中石化", "中海油", "其他"];
  const cities = ["北京", "上海", "广州", "深圳", "杭州", "南京", "成都", "武汉"];
  const fuelTypes = ["92#汽油", "95#汽油", "98#汽油", "0#柴油", "-10#柴油"];

  return Array.from({ length: count }, (_, index) => {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const stationNumber = String(index + 1).padStart(3, "0");

    return {
      id: Mock.Random.guid(),
      stationCode: `${brand.charAt(brand.length - 1)}${city.charAt(0)}${stationNumber}`,
      stationName: `${city}${brand}${Mock.Random.integer(1, 99)}号站`,
      brand,
      manager: Mock.Random.cname(),
      phone: Mock.Random.integer(13000000000, 19999999999).toString(),
      city,
      address: `${city}市${Mock.Random.county()}${Mock.Random.word(3, 8)}路${Mock.Random.integer(1, 999)}号`,
      status: Mock.Random.integer(1, 3),
      fuelTypes: Mock.Random.shuffle(fuelTypes).slice(0, Mock.Random.integer(2, 4)),
      revenue: Mock.Random.integer(50000, 800000),
      createTime: Mock.Random.datetime("yyyy-MM-dd"),
      description: Mock.Random.cparagraph(1, 3)
    };
  });
};

// 模拟数据库
let stationList = generateStationData(50);

export default [
  // 获取加油站列表
  {
    url: "/mock/gas-station/list",
    method: "get",
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, stationName = "", stationCode = "", city = "", brand = "", status = "" } = query;

      // 过滤数据
      let filteredList = stationList.filter(item => {
        let match = true;

        if (stationName && !item.stationName.includes(stationName)) {
          match = false;
        }
        if (stationCode && !item.stationCode.includes(stationCode)) {
          match = false;
        }
        if (city && !item.city.includes(city)) {
          match = false;
        }
        if (brand && item.brand !== brand) {
          match = false;
        }
        if (status && item.status.toString() !== status) {
          match = false;
        }

        return match;
      });

      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageData = filteredList.slice(start, end);

      return {
        code: 200,
        message: "获取成功",
        data: {
          list: pageData,
          total: filteredList.length,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      };
    }
  },

  // 创建加油站
  {
    url: "/mock/gas-station/create",
    method: "post",
    response: ({ body }: any) => {
      const newStation = {
        id: Mock.Random.guid(),
        ...body,
        status: 1, // 默认营业中
        revenue: 0, // 新建时营业额为0
        createTime: Mock.Random.datetime("yyyy-MM-dd")
      };

      stationList.unshift(newStation);

      return {
        code: 200,
        message: "创建成功",
        data: newStation
      };
    }
  },

  // 更新加油站
  {
    url: "/mock/gas-station/update/:id",
    method: "put",
    response: ({ body, query }: any) => {
      const { id } = query;
      const index = stationList.findIndex(item => item.id === id);

      if (index !== -1) {
        stationList[index] = { ...stationList[index], ...body };
        return {
          code: 200,
          message: "更新成功",
          data: stationList[index]
        };
      }

      return {
        code: 404,
        message: "加油站不存在"
      };
    }
  },

  // 删除加油站
  {
    url: "/api/gas-station/delete/:id",
    method: "delete",
    response: ({ query }: any) => {
      const { id } = query;
      const index = stationList.findIndex(item => item.id === id);

      if (index !== -1) {
        stationList.splice(index, 1);
        return {
          code: 200,
          message: "删除成功"
        };
      }

      return {
        code: 404,
        message: "加油站不存在"
      };
    }
  },

  // 获取加油站详情
  {
    url: "/api/gas-station/detail/:id",
    method: "get",
    response: ({ query }: any) => {
      const { id } = query;
      const station = stationList.find(item => item.id === id);

      if (station) {
        return {
          code: 200,
          message: "获取成功",
          data: station
        };
      }

      return {
        code: 404,
        message: "加油站不存在"
      };
    }
  },

  // 批量删除加油站
  {
    url: "/api/gas-station/batch-delete",
    method: "post",
    response: ({ body }: any) => {
      const { ids } = body;

      if (!ids || !Array.isArray(ids)) {
        return {
          code: 400,
          message: "参数错误"
        };
      }

      stationList = stationList.filter(item => !ids.includes(item.id));

      return {
        code: 200,
        message: `成功删除${ids.length}条记录`
      };
    }
  },

  // 获取加油站营业统计
  {
    url: "/api/gas-station/stats/:id",
    method: "get",
    response: ({ query }: any) => {
      const { id } = query;
      const station = stationList.find(item => item.id === id);

      if (!station) {
        return {
          code: 404,
          message: "加油站不存在"
        };
      }

      // 生成模拟统计数据
      const stats = {
        stationInfo: station,
        monthlyRevenue: Mock.Random.integer(50000, 800000),
        dailyRevenue: Mock.Random.integer(1500, 25000),
        fuelSales: station.fuelTypes.map((fuel: string) => ({
          fuelType: fuel,
          volume: Mock.Random.integer(1000, 10000), // 升
          revenue: Mock.Random.integer(8000, 80000) // 元
        })),
        customerCount: Mock.Random.integer(200, 1500),
        equipment: [
          { name: "1号油枪", status: "正常", fuelType: "92#汽油" },
          { name: "2号油枪", status: "正常", fuelType: "95#汽油" },
          { name: "3号油枪", status: "维护中", fuelType: "98#汽油" },
          { name: "4号油枪", status: "正常", fuelType: "0#柴油" }
        ]
      };

      return {
        code: 200,
        message: "获取成功",
        data: stats
      };
    }
  },

  // 获取油价历史记录
  {
    url: "/api/fuel-price/history",
    method: "get",
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, fuelType = "", changeType = "", dateRange = [] } = query;

      // 生成模拟油价历史数据
      const generatePriceHistory = (count: number) => {
        const fuelTypes = ["92#汽油", "95#汽油", "98#汽油", "0#柴油", "-10#柴油"];
        const changeTypes = ["up", "down", "same"];
        const statuses = ["active", "pending", "expired"];
        const operators = ["张三", "李四", "王五", "赵六"];

        return Array.from({ length: count }, (_, index) => ({
          id: Mock.Random.guid(),
          fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
          oldPrice: Mock.Random.float(7, 9, 2, 2),
          newPrice: Mock.Random.float(7, 9, 2, 2),
          changeAmount: Mock.Random.float(-0.5, 0.5, 2, 2),
          changeType: changeTypes[Math.floor(Math.random() * changeTypes.length)],
          effectiveTime: Mock.Random.datetime("yyyy-MM-dd HH:mm"),
          reason: Mock.Random.pick(["国际油价上涨", "成本调整", "市场竞争", "政策调整", "季节性调价", "运营成本变化"]),
          operator: operators[Math.floor(Math.random() * operators.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          createTime: Mock.Random.datetime("yyyy-MM-dd HH:mm")
        }));
      };

      let historyData = generatePriceHistory(50);

      // 过滤数据
      let filteredList = historyData.filter(item => {
        let match = true;

        if (fuelType && item.fuelType !== fuelType) {
          match = false;
        }
        if (changeType && item.changeType !== changeType) {
          match = false;
        }
        // 简化日期范围过滤逻辑

        return match;
      });

      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageData = filteredList.slice(start, end);

      return {
        code: 200,
        message: "获取成功",
        data: {
          list: pageData,
          total: filteredList.length,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      };
    }
  },

  // 创建调价记录
  {
    url: "/api/fuel-price/adjustment",
    method: "post",
    response: ({ body }: any) => {
      const newAdjustment = {
        id: Mock.Random.guid(),
        ...body,
        status: "pending",
        operator: "当前用户",
        createTime: Mock.Random.datetime("yyyy-MM-dd HH:mm")
      };

      return {
        code: 200,
        message: "调价设置成功",
        data: newAdjustment
      };
    }
  },

  // 获取当前油价
  {
    url: "/api/fuel-price/current",
    method: "get",
    response: () => {
      const currentPrices = [
        { fuelType: "92#汽油", description: "国标92号汽油", currentPrice: 7.52, changeType: "up", changeAmount: "+0.15" },
        { fuelType: "95#汽油", description: "国标95号汽油", currentPrice: 8.01, changeType: "up", changeAmount: "+0.16" },
        { fuelType: "98#汽油", description: "国标98号汽油", currentPrice: 8.84, changeType: "up", changeAmount: "+0.18" },
        { fuelType: "0#柴油", description: "国标0号柴油", currentPrice: 7.15, changeType: "down", changeAmount: "-0.08" },
        { fuelType: "-10#柴油", description: "国标-10号柴油", currentPrice: 7.58, changeType: "same", changeAmount: "0.00" }
      ];

      return {
        code: 200,
        message: "获取成功",
        data: currentPrices
      };
    }
  },

  // 撤销调价
  {
    url: "/api/fuel-price/adjustment/:id/cancel",
    method: "put",
    response: ({ query }: any) => {
      return {
        code: 200,
        message: "调价已撤销"
      };
    }
  },

  // 获取库存记录
  {
    url: "/api/inventory/records",
    method: "get",
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, stationId = "", recordType = "", dateRange = [] } = query;

      // 生成模拟库存记录数据
      const generateInventoryRecords = (count: number) => {
        const stations = ["北京朝阳1号站", "上海浦东2号站", "广州天河3号站"];
        const fuelTypes = ["92#汽油", "95#汽油", "98#汽油", "0#柴油", "-10#柴油"];
        const recordTypes = ["purchase", "sale", "transfer", "loss"];
        const suppliers = ["中石油", "中石化", "中海油", "外部供应商"];
        const operators = ["张三", "李四", "王五", "赵六"];
        const statuses = ["pending", "confirmed"];

        return Array.from({ length: count }, (_, index) => ({
          id: Mock.Random.guid(),
          stationName: stations[Math.floor(Math.random() * stations.length)],
          fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
          recordType: recordTypes[Math.floor(Math.random() * recordTypes.length)],
          volume: Mock.Random.integer(1000, 30000),
          unitPrice: Mock.Random.float(6, 9, 2, 2),
          amount: Mock.Random.float(10000, 200000, 2, 2),
          supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
          operator: operators[Math.floor(Math.random() * operators.length)],
          recordTime: Mock.Random.datetime("yyyy-MM-dd HH:mm"),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          remark: Mock.Random.pick(["定期补货", "紧急补货", "正常销售", "库存调拨", "盘点损耗", ""])
        }));
      };

      let inventoryData = generateInventoryRecords(80);

      // 过滤数据
      let filteredList = inventoryData.filter(item => {
        let match = true;

        if (stationId && !item.stationName.includes(stationId)) {
          match = false;
        }
        if (recordType && item.recordType !== recordType) {
          match = false;
        }

        return match;
      });

      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageData = filteredList.slice(start, end);

      return {
        code: 200,
        message: "获取成功",
        data: {
          list: pageData,
          total: filteredList.length,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      };
    }
  },

  // 创建进货记录
  {
    url: "/api/inventory/purchase",
    method: "post",
    response: ({ body }: any) => {
      const newRecord = {
        id: Mock.Random.guid(),
        ...body,
        recordType: "purchase",
        amount: body.volume * body.unitPrice,
        operator: "当前用户",
        status: "pending",
        createTime: Mock.Random.datetime("yyyy-MM-dd HH:mm")
      };

      return {
        code: 200,
        message: "进货记录创建成功",
        data: newRecord
      };
    }
  },

  // 获取储油罐信息
  {
    url: "/api/inventory/tanks",
    method: "get",
    response: ({ query }: any) => {
      const tanks = [
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
      ];

      return {
        code: 200,
        message: "获取成功",
        data: tanks
      };
    }
  },

  // 获取库存预警
  {
    url: "/api/inventory/alerts",
    method: "get",
    response: () => {
      const alerts = [
        {
          id: "a1",
          type: "error",
          title: "3号储油罐库存严重不足",
          description: "98#汽油剩余3000L，已低于安全库存线，请及时补货"
        },
        { id: "a2", type: "warning", title: "2号储油罐库存偏低", description: "95#汽油剩余8000L，建议尽快安排补货" },
        { id: "a3", type: "info", title: "5号储油罐维护中", description: "-10#柴油储油罐正在进行定期维护，预计明日完成" }
      ];

      return {
        code: 200,
        message: "获取成功",
        data: alerts
      };
    }
  },

  // 获取订单列表
  {
    url: "/api/order/list",
    method: "get",
    response: ({ query }: any) => {
      const {
        page = 1,
        pageSize = 10,
        orderNo = "",
        stationId = "",
        paymentMethod = "",
        orderStatus = "",
        dateRange = []
      } = query;

      // 生成模拟订单数据
      const generateOrders = (count: number) => {
        const stations = ["北京朝阳1号站", "上海浦东2号站", "广州天河3号站"];
        const fuelTypes = ["92#汽油", "95#汽油", "98#汽油", "0#柴油", "-10#柴油"];
        const paymentMethods = ["cash", "wechat", "alipay", "card", "member"];
        const orderStatuses = ["completed", "pending", "cancelled", "refunded"];
        const operators = ["张三", "李四", "王五", "赵六"];

        return Array.from({ length: count }, (_, index) => ({
          id: Mock.Random.guid(),
          orderNo: `JY${Mock.Random.datetime("yyyyMMddHHmmss")}${Mock.Random.string("number", 4)}`,
          stationName: stations[Math.floor(Math.random() * stations.length)],
          gunNo: `${Mock.Random.integer(1, 12)}号枪`,
          fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
          volume: Mock.Random.float(10, 80, 2, 2),
          unitPrice: Mock.Random.float(7, 9, 2, 2),
          totalAmount: Mock.Random.float(70, 600, 2, 2),
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          orderStatus: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          operator: operators[Math.floor(Math.random() * operators.length)],
          orderTime: Mock.Random.datetime("yyyy-MM-dd HH:mm:ss"),
          remark: Mock.Random.pick(["VIP客户", "会员充值", "企业用户", "普通消费", ""])
        }));
      };

      let orderData = generateOrders(120);

      // 过滤数据
      let filteredList = orderData.filter(item => {
        let match = true;

        if (orderNo && !item.orderNo.includes(orderNo)) {
          match = false;
        }
        if (stationId && !item.stationName.includes(stationId)) {
          match = false;
        }
        if (paymentMethod && item.paymentMethod !== paymentMethod) {
          match = false;
        }
        if (orderStatus && item.orderStatus !== orderStatus) {
          match = false;
        }

        return match;
      });

      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageData = filteredList.slice(start, end);

      return {
        code: 200,
        message: "获取成功",
        data: {
          list: pageData,
          total: filteredList.length,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      };
    }
  },

  // 申请退款
  {
    url: "/api/order/:id/refund",
    method: "post",
    response: ({ body }: any) => {
      return {
        code: 200,
        message: "退款申请已提交"
      };
    }
  },

  // 创建订单
  {
    url: "/api/order/create",
    method: "post",
    response: ({ body }: any) => {
      const newOrder = {
        id: Mock.Random.guid(),
        orderNo: `JY${Mock.Random.datetime("yyyyMMddHHmmss")}${Mock.Random.string("number", 4)}`,
        ...body,
        orderStatus: "pending",
        orderTime: Mock.Random.datetime("yyyy-MM-dd HH:mm:ss"),
        createTime: Mock.Random.datetime("yyyy-MM-dd HH:mm:ss")
      };

      return {
        code: 200,
        message: "订单创建成功",
        data: newOrder
      };
    }
  },

  // 取消订单
  {
    url: "/api/order/:id/cancel",
    method: "put",
    response: ({ query }: any) => {
      return {
        code: 200,
        message: "订单已取消"
      };
    }
  },

  // 获取发票数据
  {
    url: "/mock/invoice/data",
    method: "get",
    response: ({ query }: any) => {
      const { startDate, endDate, page = 1, pageSize = 10 } = query;

      // 生成发票数据
      const generateInvoiceData = (count: number) => {
        const stations = ["中国石化张江加油站", "中国石化浦东加油站", "中国石化徐汇加油站"];
        const regions = ["四川省绵阳市", "甘肃省嘉峪关市", "吉林省长春市", "甘肃省庆阳市", "河北省邯郸市"];
        const invoiceHeaders = ["上海天域物流有限公司", "上海智慧运输有限公司", "上海绿色物流有限公司"];

        return Array.from({ length: count }, (_, index) => ({
          id: `invoice_${index + 1}`,
          stationName: stations[Math.floor(Math.random() * stations.length)],
          region: regions[Math.floor(Math.random() * regions.length)],
          naturalGasAmount: Math.floor(Math.random() * 500000 + 10000),
          dieselAmount: Math.floor(Math.random() * 400000 + 5000),
          invoiceHeader: invoiceHeaders[Math.floor(Math.random() * invoiceHeaders.length)],
          createTime: Mock.Random.datetime("yyyy-MM-dd HH:mm:ss"),
          status: Math.random() > 0.7 ? "applied" : "pending"
        }));
      };

      let invoiceData = generateInvoiceData(450);

      // 时间过滤
      if (startDate && endDate) {
        invoiceData = invoiceData.filter(item => {
          const itemDate = new Date(item.createTime);
          return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
        });
      }

      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const list = invoiceData.slice(start, end);

      return {
        code: 200,
        message: "获取成功",
        data: {
          list,
          total: invoiceData.length,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      };
    }
  },

  // 申请开票
  {
    url: "/mock/invoice/apply",
    method: "post",
    response: ({ body }: any) => {
      return {
        code: 200,
        message: "开票申请提交成功",
        data: {
          recordId: Mock.Random.guid()
        }
      };
    }
  },

  // 获取发票记录
  {
    url: "/mock/invoice/records",
    method: "get",
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, status, startDate, endDate } = query;

      // 生成发票记录
      const generateInvoiceRecords = (count: number) => {
        const statuses = ["pending", "processing", "completed", "cancelled"] as const;
        const statusLabels: Record<(typeof statuses)[number], string> = {
          pending: "待审核",
          processing: "开票中",
          completed: "已完成",
          cancelled: "已取消"
        };

        return Array.from({ length: count }, (_, index) => {
          const recordStatus = statuses[Math.floor(Math.random() * statuses.length)];
          return {
            id: `invoice_record_${index + 1}`,
            invoiceNumber: recordStatus === "completed" ? `INV${Date.now()}${index}` : null,
            applyTime: Mock.Random.datetime("yyyy-MM-dd HH:mm:ss"),
            totalAmount: Math.floor(Math.random() * 1000000 + 50000),
            itemCount: Math.floor(Math.random() * 10 + 1),
            invoiceType: Math.random() > 0.5 ? "vat" : "common",
            invoiceTypeLabel: Math.random() > 0.5 ? "增值税专用发票" : "增值税普通发票",
            invoiceHeader: "上海天域物流有限公司",
            status: recordStatus,
            statusLabel: statusLabels[recordStatus],
            processTime: recordStatus === "completed" ? Mock.Random.datetime("yyyy-MM-dd HH:mm:ss") : null,
            remark: Math.random() > 0.7 ? "优先处理" : null
          };
        });
      };

      let invoiceRecords = generateInvoiceRecords(120);

      // 状态过滤
      if (status) {
        invoiceRecords = invoiceRecords.filter(record => record.status === status);
      }

      // 时间过滤
      if (startDate && endDate) {
        invoiceRecords = invoiceRecords.filter(record => {
          const recordDate = new Date(record.applyTime);
          return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        });
      }

      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const list = invoiceRecords.slice(start, end);

      return {
        code: 200,
        message: "获取成功",
        data: {
          list,
          total: invoiceRecords.length,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      };
    }
  }
] as MockMethod[];
