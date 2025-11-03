---
title: sky-take-out-day9
date: 2025-10-27 19:14:36
tags:
- 苍穹外卖
- JAVA
---

# 用户端历史订单查询

## OrderController

```JAVA
    /**
     * 历史订单查询
     *
     * @param page
     * @param pageSize
     * @param status
     * @return
     */
    @GetMapping("/historyOrders")
    @ApiOperation("历史订单查询")
    public Result<PageResult> page(int page, int pageSize, Integer status) {
        log.info("历史订单查询:{},{},{}", page, pageSize, status);
        PageResult result = orderService.page(page, pageSize, status);
        return Result.success(result);

    }
```

## <!--more-->OrderService

```JAVA
    /**
     * 历史订单查询
     *
     * @param page
     * @param pageSize
     * @param status
     * @return
     */
    PageResult page(int page, int pageSize, Integer status);
```

## OrderServiceImpl

```JAVA
    /**
     * 历史订单查询
     *
     * @param pageNum
     * @param pageSize
     * @param status
     * @return
     */
    @Override
    public PageResult page(int pageNum, int pageSize, Integer status) {
        //开启分页
        PageHelper.startPage(pageNum, pageSize);

        //将用户id和状态
        OrdersPageQueryDTO ordersPageQueryDTO = new OrdersPageQueryDTO();
        ordersPageQueryDTO.setUserId(BaseContext.getCurrentId());
        ordersPageQueryDTO.setStatus(status);

        //查询数据
        Page<OrderVO> page = orderMapper.pageQuery(ordersPageQueryDTO);

        List<OrderVO> list = new ArrayList<>();


        // 查询出订单明细，并封装入OrderVO进行响应
        if (page != null && page.getTotal() > 0) {
            for (Orders orders : page) {
                Long orderId = orders.getId();// 订单id

                // 查询订单明细
                List<OrderDetail> orderDetails = orderDetailMapper.getByOrderId(orderId);

                OrderVO orderVO = new OrderVO();
                BeanUtils.copyProperties(orders, orderVO);
                orderVO.setOrderDetailList(orderDetails);

                list.add(orderVO);
            }
        }
        return new PageResult(page.getTotal(), list);
    }
```

## OrderMapper.java

```JAVA
    /**
     * 查询购物车数据
     * @param ordersPageQueryDTO
     * @return
     */
    Page<OrderVO> pageQuery(OrdersPageQueryDTO ordersPageQueryDTO);
```

## OrderMapper.xml

```xml-dtd
<!--查询购物车数据-->
    <select id="pageQuery" resultType="com.sky.vo.OrderVO">
        select * from orders
        <where>
            <if test="number != null and number!=''">
                and number like concat('%',#{number},'%')
            </if>
            <if test="phone != null and phone!=''">
                and phone like concat('%',#{phone},'%')
            </if>
            <if test="userId != null">
                and user_id = #{userId}
            </if>
            <if test="status != null">
                and status = #{status}
            </if>
            <if test="beginTime != null">
                and order_time &gt;= #{beginTime}
            </if>
            <if test="endTime != null">
                and order_time &lt;= #{endTime}
            </if>
        </where>
        order by order_time desc
    </select>
```

## 分页思维梳理

1、将前端送来的status数据以及通过`BaseContext.getCurrentId()`获取到的用户id封装到OrdersPageQuerDTO中

2、通过OrderPageQuerDTO的数据进行分页查询。

3、用户接口文档中需要orderDetailList数据，因此需要查询订单明细

4、我们通过遍历获取到的分页数据，根据订单id查询订单明细，然后将一行订单数据和对应的订单明细封装到OrderVO中作为分页结果返回给前端。

# 用户端查询订单详情

## OrderController

```JAVA
    /**
     * 查询订单详情
     */
    @GetMapping("/orderDetail/{id}")
    @ApiOperation("查询订单详情")
    public Result<OrderVO> details(@PathVariable Long id) {
        log.info("查询订单:{}", id);
        OrderVO orderVO = orderService.details(id);
        return Result.success(orderVO);
    }
```

## OrderService

```JAVA
    /**
     * 查询订单详情
     *
     * @param id
     * @return
     */
    OrderVO details(Long id);
```

## OrderServiceImpl

```JAVA
    /**
     * 查询订单详情
     *
     * @param id
     * @return
     */
    @Override
    public OrderVO details(Long id) {
        //根据id查询订单
        Orders order = orderMapper.getById(id);

        // 查询该订单对应的菜品/套餐明细
        List<OrderDetail> orderDetails = orderDetailMapper.getByOrderId(id);

        //数据复制
        OrderVO orderVO = new OrderVO();
        BeanUtils.copyProperties(order, orderVO);
        orderVO.setOrderDetailList(orderDetails);
        return orderVO;
    }
```

OrderMapper.java

```JAVA
    @Select("select * from order_detail where order_id = #{id}")
    List<OrderDetail> getByOrderId(Long orderId);
```

# 用户端用户取消订单

## OrderController

```JAVA
    /**
     * 用户取消订单
     *
     * @return
     */
    @PutMapping("/cancel/{id}")
    @ApiOperation("取消订单")
    public Result cancel(@PathVariable Long id) throws Exception {
        log.info("用户取消订单id:{}", id);
        orderService.userCancelById(id);
        return Result.success();
    }
```

## OrderService

```JAVA
    /**
     * 用户取消订单
     *
     * @param id
     */
    void userCancelById(Long id) throws Exception;
```

## OrderServiceImpl

```JAVA
    /**
     * 用户取消订单
     *
     * @param id
     */
    @Override
    @Transactional
    public void userCancelById(Long id) throws Exception {
        //根据id查询订单
        Orders ordersDB = orderMapper.getById(id);

        //校验订单是否存在
        if (ordersDB == null) {
            throw new OrderBusinessException(MessageConstant.ORDER_NOT_FOUND);
        }

        //订单状态 1待付款 2待接单 3已接单 4派送中 5已完成 6已取消
        if (ordersDB.getStatus() > 2) {
            throw new OrderBusinessException(MessageConstant.ORDER_STATUS_ERROR);
        }

        Orders orders = new Orders();
        orders.setId(ordersDB.getId());

        // 订单处于待接单状态下取消，需要进行退款
        if (ordersDB.getStatus().equals(Orders.TO_BE_CONFIRMED)) {
            //调用微信支付退款接口
//            weChatPayUtil.refund(
//                    ordersDB.getNumber(), //商户订单号
//                    ordersDB.getNumber(), //商户退款单号
//                    new BigDecimal(0.01),//退款金额，单位 元
//                    new BigDecimal(0.01));//原订单金额

            //支付状态修改为 退款
            orders.setPayStatus(Orders.REFUND);
        }

        // 更新订单状态、取消原因、取消时间
        orders.setStatus(Orders.CANCELLED);
        orders.setCancelReason("用户取消");
        orders.setCancelTime(LocalDateTime.now());
        orderMapper.update(orders);
    }
```

# 用户端再来一单

## OrderController

```JAVA
    /**
     * 再来一单
     *
     * @param id
     * @return
     */
    @PostMapping("/repetition/{id}")
    @ApiOperation("再来一单")
    public Result repetition(@PathVariable Long id) {
        log.info("需要再来一单的id:{}",id);
        orderService.repetition(id);
        return Result.success();
    }
```

## OrderService

```JAVA
    /**
     * 再来一单
     *
     * @param id
     */
    void repetition(Long id);
```

## OrderServiceImpl

```JAVA
    /**
     * 再来一单
     *
     * @param id
     */
    @Override
    public void repetition(Long id) {
        //查询当前用户id
        Long userId = BaseContext.getCurrentId();

        // 根据订单id查询当前订单详情
        List<OrderDetail> orderDetailList = orderDetailMapper.getByOrderId(id);

        //将订单详情对象转换为购物车对象
        List<ShoppingCart> shoppingCartList = orderDetailList.stream().map(x -> {
            ShoppingCart shoppingCart = new ShoppingCart();

            //将原订单详情里面的菜品信息重新复制到购物车对象中
            BeanUtils.copyProperties(x, shoppingCart, "id");
            shoppingCart.setCreateTime(LocalDateTime.now());
            shoppingCart.setUserId(userId);


            return shoppingCart;
        }).collect(Collectors.toList());


        //将购物车对象批量添加到数据库
        shoppingCartMapper.insertBatch(shoppingCartList);
    }
```

