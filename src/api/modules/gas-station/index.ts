import request from "@/api/index";

/**
 * 获取加油站列表
 */
export function getGasStationListAPI(params?: any) {
  return request({
    url: "/mock/gas-station/list",
    method: "get",
    params
  });
}

/**
 * 创建加油站
 */
export function createGasStationAPI(data: any) {
  return request({
    url: "/mock/gas-station/create",
    method: "post",
    data
  });
}

/**
 * 更新加油站信息
 */
export function updateGasStationAPI(id: string, data: any) {
  return request({
    url: `/gas-station/update/${id}`,
    method: "put",
    data
  });
}

/**
 * 删除加油站
 */
export function deleteGasStationAPI(id: string) {
  return request({
    url: `/gas-station/delete/${id}`,
    method: "delete"
  });
}

/**
 * 获取加油站详情
 */
export function getGasStationDetailAPI(id: string) {
  return request({
    url: `/gas-station/detail/${id}`,
    method: "get"
  });
}

/**
 * 批量删除加油站
 */
export function batchDeleteGasStationAPI(ids: string[]) {
  return request({
    url: "/gas-station/batch-delete",
    method: "post",
    data: { ids }
  });
}

/**
 * 导出加油站数据
 */
export function exportGasStationAPI(params?: any) {
  return request({
    url: "/gas-station/export",
    method: "get",
    params,
    responseType: "blob"
  });
}

/**
 * 获取加油站营业统计
 */
export function getGasStationStatsAPI(id: string, params?: any) {
  return request({
    url: `/gas-station/stats/${id}`,
    method: "get",
    params
  });
}

/**
 * 获取油价历史记录
 */
export function getFuelPriceHistoryAPI(params?: any) {
  return request({
    url: "/fuel-price/history",
    method: "get",
    params
  });
}

/**
 * 创建调价记录
 */
export function createPriceAdjustmentAPI(data: any) {
  return request({
    url: "/fuel-price/adjustment",
    method: "post",
    data
  });
}

/**
 * 获取当前油价
 */
export function getCurrentFuelPricesAPI() {
  return request({
    url: "/fuel-price/current",
    method: "get"
  });
}

/**
 * 撤销调价
 */
export function cancelPriceAdjustmentAPI(id: string) {
  return request({
    url: `/fuel-price/adjustment/${id}/cancel`,
    method: "put"
  });
}

/**
 * 获取库存记录
 */
export function getInventoryRecordsAPI(params?: any) {
  return request({
    url: "/inventory/records",
    method: "get",
    params
  });
}

/**
 * 创建进货记录
 */
export function createPurchaseRecordAPI(data: any) {
  return request({
    url: "/inventory/purchase",
    method: "post",
    data
  });
}

/**
 * 获取储油罐信息
 */
export function getFuelTanksAPI(params?: any) {
  return request({
    url: "/inventory/tanks",
    method: "get",
    params
  });
}

/**
 * 获取库存预警
 */
export function getInventoryAlertsAPI() {
  return request({
    url: "/inventory/alerts",
    method: "get"
  });
}

/**
 * 获取订单列表
 */
export function getOrderListAPI(params?: any) {
  return request({
    url: "/order/list",
    method: "get",
    params
  });
}

/**
 * 申请退款
 */
export function refundOrderAPI(orderId: string) {
  return request({
    url: `/order/${orderId}/refund`,
    method: "post"
  });
}

/**
 * 创建订单
 */
export function createOrderAPI(data: any) {
  return request({
    url: "/order/create",
    method: "post",
    data
  });
}

/**
 * 取消订单
 */
export function cancelOrderAPI(orderId: string) {
  return request({
    url: `/order/${orderId}/cancel`,
    method: "put"
  });
}

/**
 * 获取发票数据
 */
export function getInvoiceDataAPI(params?: any) {
  return request({
    url: "/mock/invoice/data",
    method: "get",
    params
  });
}

/**
 * 申请开票
 */
export function applyInvoiceAPI(data: any) {
  return request({
    url: "/mock/invoice/apply",
    method: "post",
    data
  });
}

/**
 * 获取发票记录
 */
export function getInvoiceRecordsAPI(params?: any) {
  return request({
    url: "/mock/invoice/records",
    method: "get",
    params
  });
}

/**
 * 获取发票详情
 */
export function getInvoiceDetailAPI(id: string) {
  return request({
    url: `/mock/invoice/detail/${id}`,
    method: "get"
  });
}

/**
 * 取消发票申请
 */
export function cancelInvoiceAPI(id: string) {
  return request({
    url: `/mock/invoice/cancel/${id}`,
    method: "put"
  });
}
