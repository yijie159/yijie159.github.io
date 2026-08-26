---
title: RabbitMQ 学习笔记
date: 2026-08-26 10:00:00
tags:
  - RabbitMQ
  - MQ
categories:
  - 天机学堂
---
# MQ基础<!--more-->

## RabbitMQ概念

异步通信和同步通信的区别

![image-20260423160027133](/images/RabbitMQ/image-20260423160027133.png)

课程背景

![image-20260423160426177](/images/RabbitMQ/image-20260423160426177.png)

![image-20260423160526764](/images/RabbitMQ/image-20260423160526764.png)

## 同步调用

以黑马商城的余额支付为例：

![image-20260423161033595](/images/RabbitMQ/image-20260423161033595.png)

- 扩展性差(开闭原则)
- 性能下降

同步调用的优势是什么

- 时效性强，等待到结果后才返回

同步调用的问题是什么

- 扩展性差
- 性能下降
- 级联失败问题

## 异步调用

异步调用方式其实就是**基于消息通知**的方式，一般包含3个角色：

- 消息发送者：投递消息的人，就是原来的调用方
- 消息代理：管理、暂存、转发信息，可以理解为微信服务器(外卖柜、快递站)
- 消息接收者：接受和处理消息的人，就是原来的服务提供方

![image-20260423162059426](/images/RabbitMQ/image-20260423162059426.png)

交付服务不再同步调用业务关联度低的服务，而是发送消息通知到Brokder

具备下列优势：

- 解除耦合，扩展性强
- 无需等待，性能好
- 故障隔离
- 缓存消息，流量削峰填谷![image-20260423162535233](/images/RabbitMQ/image-20260423162535233.png)

![image-20260423162328740](/images/RabbitMQ/image-20260423162328740.png)

异步调用的优势是什么

- 耦合度低，扩展性强
- 异步调用，无需等待，性能好
- 故障隔离，下游服务故障不影响上游业务
- 缓存消息，流量削峰填谷

异步调用的问题是什么

- 不能立即得到调用结果，时效性差
- 不确定下游业务执行是否成功
- 业务安全依赖于Broker的可靠性

## MQ技术选型

![image-20260423163019849](/images/RabbitMQ/image-20260423163019849.png)

## RabbitMQ-认识和安装

### 基础介绍

RabbitMQ是基于Erlang语言开发的开源消息通信中间件，官网地址：https://www.rabbitmq.com

#### RabbitMQ的整体架构及核心概念

- virtual-host：虚拟主机，起到数据隔离的作用

- publisher：消息发送者
- consumer：消息的消费者
- queue：队列，存储消息
- exchange：交换机，负责路由消息

![image-20260423193828211](/images/RabbitMQ/image-20260423193828211.png)

我的理解：

生产者Publisher阶段生产者只负责把消息投递到交换机Exchange当中，投递完成后就结束工作，然后rabbitmq的服务有很多层的虚拟主机，一个Exchange绑定了多个Queue，publisher发送的消息就全部给到了队列当中，consumer会自己去看消息队列有没有自己的想要的消息，这样就获取出来了

### 快速入门

需求：再RabbitMQ的控制台完成下列操作：

- 新建队列hello.queue1和hello.queue2
- 向默认的amp.fanout交换机发送一条消息
- 查看消息是否到达hello.queue1和hello.queue2
- 总结规律

### 数据隔离

需求：在RabbitMQ的控制台完成下列操作

- 新建一个用户hmall
- 为hmall用户创建一个virtual host
- 测试不同virtual host之间的数据隔离现象

## JAVA客户端

### 快速入门

![image-20260423213912800](/images/RabbitMQ/image-20260423213912800.png)

需求如下：

- 利用控制台创建队列simple.queue
- 在publisher服务中，利用SpringAMQP直接向simple.queue发送消息
- 在consumer服务中，利用SpringAMQP编写消费者，监听simple.queue队列

![image-20260423214328933](/images/RabbitMQ/image-20260423214328933.png)

1. 引入spring-amqp依赖

```xml
        <!--AMQP依赖，包含RabbitMQ-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-amqp</artifactId>
        </dependency>
```

2. 配置RabbitMQ服务端信息

```yaml
spring:
  rabbitmq:
    host: <主机名>
    port: 5672
    virtual-host: /hmall
    username: hmall
    password: 123
```

3. 发送消息
   - SpringAMQP提供了RabbitTemplate工具类，方便我们发送消息。发送消息代码如下：

```java
package com.itheima.publisher;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class SpringAmqpTest {

    @Autowired
    private RabbitTemplate rabbitTemplate;


    @Test
    void testSendMessage2Queue(){
        String queueName = "simple.queue";
        String msg = "hello,amqp!";
        rabbitTemplate.convertAndSend(queueName,msg);
    }
}

```

4. 接受消息
   - SpringAMQP提供声明式的消息监听，我们只需要通过注解在方法上声明要监听的队列名称，将来SpringAMQP就会把消息传递给当前方法

```java
package com.itheima.consumer.listeners;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MqListener {

    @RabbitListener(queues = "simple.queue")
    public void listenSimpleQueue(String msg) {
        System.out.println("消费者收到了simple.queue的消息：【" + msg + "】");
    }
}

```

### WorkQueue

模拟WorkQueue，实现一个队列绑定多个消费者

基本思路如下：

1. 在RabbitMQ的控制台创建一个队列，名为work.queue
2. 在publisher服务中定义测试方法，在1秒内产生50条消息，发送到work.queue
3. 在consumer服务中定义两个消息监听者，都监听work.queue队列
4. 消费者1每秒处理50条消息，消费者2每秒处理5条消息

#### 消费者消息推送限制

默认情况下，RabbitMQ的会将消息依次轮询投递给绑定在队列上的每一个消费者。但这并没有考虑到消费者是否已经处理完消息，可能出现消息堆积。

因此我们需要修改application.yml，设置preFetch值为1，确保同一时刻最多投递给消费者1条消息：

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        prefetch: 1 #每次只能获取一条消息，处理完成才能获取下一个消息
```

work模型的使用：

- 多个消费者绑定到一个队列，可以加快消息处理速度
- 同一条消息只会被一个消费者处理
- 通过设置**prefetch**来控制消费者预取的消息数量，处理完一条再处理下一条，实现能者多劳

### Fanout交换机

真正生产环境都会经过exchange来发送消息，而不是直接发送到队列，交换机的类型有以下三种：

- Fanout：广播
- Direct：定向
- Topic：话题

![image-20260424163228505](/images/RabbitMQ/image-20260424163228505.png)

Fanout Exchange会将接收到的**消息广播**到每一个跟其绑定的queue，所以也叫广播模式

#### 利用Spring AMQP演示FanoutExchange的使用

实现思路如下：

1. 在RabbitMQ控制台中，声明队列fanout.queue1和fanout.queue2
2. 在RabbitMQ控制台中，声明交换机hmall.fanout，将两个队列与其绑定
3. 在consumer服务中，编写两个消费者方法，分别监听fanout.queue1和fanout.queue2
4. 在publisher中编写测试方法，向hmall.fanout发送消息

MqListener.java

```java
    @RabbitListener(queues = "fanout.queue1")
    public void listenFanoutQueue1(String msg) {
        System.out.println("消费者1收到了fanout.queue1的消息：【" + msg + "】");
    }

    @RabbitListener(queues = "fanout.queue2")
    public void listenFanoutQueue2(String msg) {
        System.out.println("消费者2收到了fanout.queue2的消息：【" + msg + "】");
    }
```

RabbitMQ监听队列为`fanout.queue1和fanout.queue2`的队列

publisher类

```java
    @Test
    void testSendFanout(){
        String exchangeName = "hmall.fanout";
        String msg = "hello,everyone!";
        rabbitTemplate.convertAndSend(exchangeName,"",msg);
    }
```

这里我们用mq发送给名为`hmall.fanout`的交换机一个msg

#### 交换机的作用是什么

- 接收publisher发送的消息
- 将消息按照规则路由到与之绑定的队列
- FanoutExchange的会将消息路由到每个绑定的队列

#### 使用的业务场景

##### 1. 系统日志、全局通知推送

- 例子：系统公告、服务全局告警、运维日志广播
- 需求：所有微服务 / 多个消费端都需要接收同一条通知

##### 2. 多服务缓存刷新、配置同步

- 例子：修改字典、商品基础配置、权限规则后
- 场景：需要**所有关联服务同时更新本地缓存**，保证数据一致性

##### 3. 集群内任务广播、多实例同步操作

- 例子：分布式服务集群，需要所有节点同时执行操作（重置、下线、预热）

##### 4. 即时通讯、聊天室、多人消息

- 聊天室群消息、直播弹幕广播、全员消息推送

### Direct交换机

Direct Exchange会将接收到的消息**根据规则路由到指定的Queue**，因此称为**定向路由**

- 每一个Queue都与Exchange设置一个**BindingKey**
- 发布者发送消息时，指定消息的RoutingKey
- Exchange将消息路由到BindingKey与消息RoutingKey一致的队列

![image-20260424172920381](/images/RabbitMQ/image-20260424172920381.png)

![image-20260424172939553](/images/RabbitMQ/image-20260424172939553.png)

![image-20260424173005384](/images/RabbitMQ/image-20260424173005384.png)

利用 SpringAMQP 演示 DirectExchange 的使用

**需求如下：**

1. 在 RabbitMQ 控制台中，声明队列`direct.queue1`和`direct.queue2`
2. 在 RabbitMQ 控制台中，声明交换机`hmall.direct`，将两个队列与其绑定
3. 在 consumer 服务中，编写两个消费者方法，分别监听`direct.queue1`和`direct.queue2`
4. 在 publisher 中编写测试方法，利用不同的 RoutingKey 向`hmall.direct`发送消息

MqListener.java

```java
    @RabbitListener(queues = "direct.queue1")
    public void listenDirectQueue1(String msg) {
        System.out.println("消费者1收到了direct.queue1的消息：【" + msg + "】");
    }

    @RabbitListener(queues = "direct.queue2")
    public void listenDirectQueue2(String msg) {
        System.out.println("消费者2收到了direct.queue2的消息：【" + msg + "】");
```

comsumer

```java
    @Test
    void testSendDirect(){
        String exchangeName = "hmall.direct";
        String msg = "蓝色警报：由于日本排放核污水，惊现哥斯拉！";
        rabbitTemplate.convertAndSend(exchangeName,"red",msg);
    }
```

### Topic交换机

TopicExchange与DirectExchange类似，区别在于routingKey可以是多个单词的列表，并且以`.`分割。

Queue与Exchange指定BindingKey时可以使用通配符：

- #：代指0个或多个单词
- *：代指一个单词

![image-20260425162641067](/images/RabbitMQ/image-20260425162641067.png)

#### 利用 SpringAMQP 演示 TopicExchange 的使用

##### 需求如下：

1. 在 RabbitMQ 控制台中，声明队列 `topic.queue1` 和 `topic.queue2`
2. 在 RabbitMQ 控制台中，声明交换机 `hmall.topic`，将两个队列与其绑定
3. 在 consumer 服务中，编写两个消费者方法，分别监听 `topic.queue1` 和 `topic.queue2`
4. 在 publisher 中编写测试方法，利用不同的 RoutingKey 向 `hmall.topic` 发送消息

![image-20260425162727415](/images/RabbitMQ/image-20260425162727415.png)

MqListener.java

```java
    @RabbitListener(queues = "topic.queue1")
    public void listenTopicQueue1(String msg) {
        System.out.println("消费者1收到了topic.queue1的消息：【" + msg + "】");
    }

    @RabbitListener(queues = "topic.queue2")
    public void listenTopicQueue2(String msg) {
        System.out.println("消费者2收到了topic.queue2的消息：【" + msg + "】");
    }
```

comsumer

```java
    @Test
    void testSendTopic(){
        String exchangeName = "hmall.topic";
        String msg = "今天天气挺不错！";
        rabbitTemplate.convertAndSend(exchangeName,"china.weather",msg);
    }
```

### Direct交换机和Topic交换机的差异

- Topic交换机接受的消息RoutingKey可以是多个单词，以`.`分割
- Topic交换机与队列绑定时的bindingKey可以指定通配符
- #：代表0个或多个词
- *：代表1个词

SpringAMQP提供了几个类，用来声明队列、交换机及其绑定关系：

- Queue：用于声明队列，可以用工厂类QueueBuilder构建
- Exchange：用于声明交换机，可以用工厂类ExchangeBuilder构建
- Binding：用于声明队列和交换机的绑定关系，可以用工厂类BindingBuilder构建

​                                ![image-20260425164653481](/images/RabbitMQ/image-20260425164653481.png)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

### 声明队列交换机

FanoutConfiguration.java

```java
package com.itheima.consumer.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FanoutConfiguration {

    @Bean
    public FanoutExchange fanoutExchange(){
//        ExchangeBuilder.fanoutExchange("hmall.fanout2").build();
        return new FanoutExchange("hmall.fanout2");
    }

    @Bean
    public Queue fanoutQueue3(){
//        QueueBuilder.durable("ff").build();//持久化
        return new Queue("fanout.queue3");
    }

    @Bean
    public Binding fanoutBinding3(Queue fanoutQueue3, FanoutExchange fanoutExchange){
        return BindingBuilder.bind(fanoutQueue3).to(fanoutExchange);
    }

    @Bean
    public Queue fanoutQueue4(){
//        QueueBuilder.durable("ff").build();//持久化
        return new Queue("fanout.queue4");
    }

    @Bean
    public Binding fanoutBinding4(){
        //此处直接调用方法并没有重复创建，会被spring拦截从IOC中直接return
        return BindingBuilder.bind(fanoutQueue4()).to(fanoutExchange());
    }
}
```

如果使用DirectConfiguration就需要设置routingKey通过with()

但是如果我们需要设置多个队列和routingKey就需要使用很多的`Queue`方法和`Binding`方法，过于臃肿了。

因此SpringAMQP还提供了基于@RabbitListener注解来声明队列和交换机的方式：

```java
    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(name = "direct.queue1",durable = "true"),
            exchange = @Exchange(name = "hmall.direct",type = ExchangeTypes.DIRECT),
            key = {"red","blue"}
    ))
    public void listenDirectQueue1(String msg) {
        System.out.println("消费者1收到了direct.queue1的消息：【" + msg + "】");
    }

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(name = "direct.queue2",durable = "true"),
            exchange = @Exchange(name = "hmall.direct",type = ExchangeTypes.DIRECT),
            key = {"red","yellow"}
    ))
    public void listenDirectQueue2(String msg) {
        System.out.println("消费者2收到了direct.queue2的消息：【" + msg + "】");
    }
```

这样就减少了冗余，并且这样的好处是，一旦运行启动之后，会在rabbit服务器上自动创建queue和exchange。

#### 声明队列、交换机、绑定关系的bean

- Queue
- FanoutExchange、DirectExchange、TopicExchange
- Binding

#### 基于@RabbitListener注解声明队列和交换机有哪些常见注解

- @Queue
- @Exchange

### 消息转换器

需求：测试利用SpringAMQP发送对象类型的消息

1. 声明一个队列，名为object.queue
2. 编写单元测试，向队列中直接发送一条消息，消息类型为Map
3. 在控制台查看消息，总结你能发现的问题

Spring 的对消息对象的处理是由`org.springframework.amqp.support.converter.MessageConverter`来处理的。而默认实现是`SimpleMessageConverter`，基于 JDK 的`ObjectOutputStream`完成序列化。

存在下列问题：

- JDK 的序列化有安全风险
- JDK 序列化的消息太大
- JDK 序列化的消息可读性差

因此建议采用JSON序列化代替默认的JDK序列化，要做两件事情：

在publisher和consumer中都要引入jackson以来：

```xml
        <!--Jackson-->
        <dependency>
            <groupId>com.fasterxml.jackson.dataformat</groupId>
            <artifactId>jackson-dataformat-xml</artifactId>
        </dependency>
```

在publisher和consumer中都要配置MessageConverter：

```java
    @RabbitListener(queues = "object.queue")
    public void listenObject(Map<String, Object> msg) {
        System.out.println("消费者收到了object.queue的消息：【" + msg + "】");
    }
```

### 业务改造

需求：改造余额支付功能，不再同步调用交易服务的OpenFeign接口，而是采用异步MQ通知交易服务更新订单状态

![image-20260425195943943](/images/RabbitMQ/image-20260425195943943.png)

#### 接收消息

```java
package com.hmall.trade.listener;
 
import com.hmall.trade.service.IOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.ExchangeTypes;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
 
@Component
@RequiredArgsConstructor
public class PayStatusListener {
 
    private final IOrderService orderService;
 
    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(name = "mark.order.pay.queue", durable = "true"),
            exchange = @Exchange(name = "pay.topic", type = ExchangeTypes.TOPIC),
            key = "pay.success"
    ))
    public void listenPaySuccess(Long orderId){
        orderService.markOrderPaySuccess(orderId);
    }
}
```

#### 发送消息

修改`pay-service`服务下的`com.hmall.pay.service.impl.PayOrderServiceImpl`类中的`tryPayOrderByBalance`方法：

```java
private final RabbitTemplate rabbitTemplate;
 
@Override
@Transactional
public void tryPayOrderByBalance(PayOrderDTO payOrderDTO) {
    // 1.查询支付单
    PayOrder po = getById(payOrderDTO.getId());
    // 2.判断状态
    if(!PayStatus.WAIT_BUYER_PAY.equalsValue(po.getStatus())){
        // 订单不是未支付，状态异常
        throw new BizIllegalException("交易已支付或关闭！");
    }
    // 3.尝试扣减余额
    userClient.deductMoney(payOrderDTO.getPw(), po.getAmount());
    // 4.修改支付单状态
    boolean success = markPayOrderSuccess(payOrderDTO.getId(), LocalDateTime.now());
    if (!success) {
        throw new BizIllegalException("交易已支付或关闭！");
    }
    // 5.修改订单状态
    // tradeClient.markOrderPaySuccess(po.getBizOrderNo());
    try {
        rabbitTemplate.convertAndSend("pay.topic", "pay.success", po.getBizOrderNo());
    } catch (Exception e) {
        log.error("支付成功的消息发送失败，支付单id：{}， 交易单id：{}", po.getId(), po.getBizOrderNo(), e);
    }
}
```

# RabbitMQ高级：可靠消息服务队列rabbitMQ高级特性

## 消息可靠性

消息从生产者发送到exchange，再到queue，再到消费者，有哪些导致消息丢失的可能性？

- 发送时丢失：
  - 生产者发送的消息未送达exchange
  - 消息到达exchange后到达queue
- MQ宕机，queue将消息丢失
- consumer接收到消息后未消费就宕机

### 生产者消息确认

#### 生产者确认机制

RabbitMQ提供了publisher confirm机制来避免消息发送到MQ过程中丢失。消息发送到MQ以后，会返回一个结果给发送者，表示消息是否处理成功。结果有两种请求：

- publisher-confirm，发送者确认
  - 消息成功投递到交换机，返回ack
  - 消息未投递到交换机，返回nack
- publisher-return，发送者回执
  - 消息投递到交换机了，但是没有路由到队列。返回ACK，及路由失败原因。

**注意：**

确认机制发送消息时，需要给每个消息设置一个全局唯一id，以区分不同消息，避免ack冲突

![image-20260818164325361](/images/RabbitMQ/image-20260818164325361.png)

#### SpringAMQP实现生产者确认

1. 在publisher这个微服务的application.yml中添加配置

```yaml
spring:
  rabbitmq:
    publisher-confirm-type: correlated
    publisher-returns: true
    template:
      mandatory: true
```

配置说明：

- publish-confirm-type：开启publisher-confirm,这里支持两种类型：
  - simple：同步等待confirm结果，直到超时
  - correlated：异步回调，定义ConfirmCallback，MQ返回结果时会回调这个ConfirmCallback
- publish-returns：开启publish-return功能，同样是基于callback机制，不过是定义ReturnCallback
- template.mandatory：定义消息路由失败时的策略。true，则调用ReturnCallback；false：则直接丢弃消息

2. 每个RabbitTemplate只能配置一个RetrunCallback，因此需要在项目启动过程中配置：

```java
@Slf4j
@Configuration
public class CommonConfig implements ApplicationContextAware {

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        // 获取RabbitTemplate
        RabbitTemplate rabbitTemplate = applicationContext.getBean(RabbitTemplate.class);
        // 设置ReturnCallback
        rabbitTemplate.setReturnCallback((message, replyCode, replyText, exchange, routingKey) -> {
            log.info("消息发送失败，应答码{}，原因{}，交换机{}，路由键{}，消息{}",
                    replyCode, replyText, exchange, routingKey, message.toString());
        });
    }
}
```

3. 发送消息，指定消息ID、消息ConfirmCallback

```java
@Test
public void testSendMessage2SimpleQueue() throws InterruptedException {
    // 消息体
    String message = "hello, spring amqp!";
    
    // 消息ID，需要封装到CorrelationData中
    CorrelationData correlationData = new CorrelationData(UUID.randomUUID().toString());
    
    // 添加callback
    correlationData.getFuture().addCallback(
        result -> {
            if (result.isAck()) {
                // ack，消息成功
                log.debug("消息发送成功，ID:{}", correlationData.getId());
            } else {
                // nack，消息失败
                log.error("消息发送失败，ID:{}, 原因{}", correlationData.getId(), result.getReason());
            }
        },
        ex -> log.error("消息发送异常，ID:{}, 原因{}", correlationData.getId(), ex.getMessage())
    );
    
    // 发送消息
    rabbitTemplate.convertAndSend("amq.direct", "simple", message, correlationData);
}
```

SpringAMQP中处理消息确认的几种情况：

- publisher-comfirm:
  - 消息成功发送到exchage，返回ack
  - 消息发送失败，没有到达交换机，返回nack
  - 消息发送过程中出现异常，没有收到回执
- 消息成功发送到exchange，但没有路由到queue，调用ReturnCallback

### 消息持久化

MQ默认是内存存储消息，开启持久化功能可以确保缓存在MQ中的消息不丢失

1. 交换机持久化

```java
@Bean
public DirectExchange simpleExcange(){
    // 三个参数：交换机名称、是否持久化、当没有queue与其绑定时是否自动删除
    return new DirectExchange("simple.direct",true,false);
}
```

2. 队列持久化

```java
@Bean
public Queue simpleQueue(){
    //使用QueueBuilder构建队列，durable就是持久化的
    return QueueBuilder.durable("simple.queue").build();
}
```

3. 消息持久化，SpringAMQP中的消息默认是持久的，可以通过MessageProperties中的DeliveryMode来指定的：

```java
Message message = MessageBuilder.withBody("hello, spring".getBytes(StandardCharsets.UTF_8))
                .setDeliveryMode(MessageDeliveryMode.PERSISTENT)
                .build();
```

### 消费者消息确认

RabbitMQ支持消费者确认机制，即：消费者处理消息后可以向MQ发送ack回执，MQ收到ack回执后才会删除该消息。

而SpringAMQP则允许配置三种确认模式：

- manual：手动ack，需要在业务代码结束后，调用api发送ack
- auto：自动ack，由spring监测listener代码是否出现异常，没有异常则返回ack；抛出异常则返回nack
- none：关闭ack，MQ假定消费者获取消息后会成功处理，因此消息投递后立即被删除

配置方式是修改application.yml文件，添加下面配置：

```yaml
spring:
	rabbitmq:
		listener:
			simple:
				prefetch: 1
				acknowledge-mode: none #none,关闭ack;manual，手动ack;auto：自动ack
```

### 失败重试机制

当消费者出现异常后，消息会不断requeue(重新入队)到队列，再重新发送给消费者，然后再次异常，再次requeue，无限循环，导致mq的消息处理飙升，带来不必要的压力：

我们可以利用Spring的retry机制，在消费者出现异常时利用本地重试，而不是无限制的requeue到mq队列

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        prefetch: 1
        acknowledge-mode: auto
        retry:
          enabled: true           #开启消费者失败重试机制
          initial-interval: 1000  #初始的失败等待时长为1秒
          multiplier: 3           #下次失败的等待时长倍数，下次等待时长 = multiplier * last-interval
          max-attempts: 4         #最大重试次数
          stateless: true         #true无状态；false有状态。如果业务中包含十五，这里改为false
```

#### 消费者失败消息处理策略

在开启重试模式后，重试次数耗尽，如果消息依然失败，则需要有MessageRecoverer接口来处理，它包含三种不同的实现：

- RejectAndDontRequeueRecoverer:重试耗尽后，直接reject，丢弃消息。默认就是这种方式
- ImmediateRequeueMessageRecover:重试耗尽后，返回nack，消息重新入队
- RepublishMessageRecoverer:重试耗尽后，将失败消息投递到指定的交换机

![image-20260820141352988](/images/RabbitMQ/image-20260820141352988.png)

测试下RepublishMessageRecoverer处理模式：

- 首先，定义接受失败消息的交换机、队列及其绑定关系：

```java
@Bean
public DirectExchange errorMessageExchange(){
    return new DirectExchange("error.direct");
}
@Bean
public Queue errorQueue(){
    return new Queue("error.queue",true);
}
@Bean
public Binding errorBinding(){
    return BindingBuilder.bind(errorQueue()).to(errorMessageExchange()).with("error");
}
```

- 然后，定义RepublishMessageRecoverer:

```java
@Bean
public MessageRecover republishMessageRecoverer(RabbitTemplate rabbitTemplate){
    return new RepublishMessageRecoverer(rabbitTemplate,"error.direct","error");
}
```

#### 总结

如何确保RabbitMQ消息的可靠性？

- 开启生产者确认机制，确保生产者的消息能到达队列
- 开启持久化功能，确保消息未消费前在队列中不会丢失
- 开启消费者确认机制为auto，由spring确认消息处理成功后完成ack
- 开启消费者失败重试机制，并设置MessageRecoverer，多次重试失败后将消息投递到异常交换机，交给人工处理

## 死信交换机

### 初识死信交换机

当一个队列中的消息满足下列情况之一时，可以成为<span style = "color:red">死信(dead letter)</span>

- 消费者使用basic.reject或basic.nack声明消费失败，并且消息的requeue参数设置为false
- 消息是一个过期消息，超时无人消费
- 要投递的队列消息堆积满了，最早的消息可能成为死信

如果该队列配置了dead-letter-exchange属性，指定了一个交换机，那么队列中的死信就会投递到这个交换机中，这个交换机就称为<span style = "color:red">死信交换机(Dead Letter Exchange,简称DLX)</span>

![image-20260820150207317](/images/RabbitMQ/image-20260820150207317.png)

什么样的消息会成为死信？

- 消费被消费者reject或返回nack
- 消息超时未消费
- 队列满了

如何给队列绑定死信交换机？

- 给队列设置dead-letter-exchange属性，指定一个交换机
- 给队列设置deed-letter-routing-key属性，设置死信交换机与死信队列的RoutingKey

### TTL

如果一个队列中的消息TTL结束仍未消费，则会变为死信，ttl超市分为两种情况：

- 消息所在的队列设置了存活时间
- 消息本身设置了存活时间

![image-20260820151805426](/images/RabbitMQ/image-20260820151805426.png)

声明一组死信交换机和队列，基于注解方式：

```java
@RabbitListener(bindings = @QueueBinding(
    value = @Queue(name = "dl.queue", durable = "true"),
    exchange = @Exchange(name = "dl.direct"),
    key = "dl"
))
public void listenDLQueue(String msg) {
    log.info("接收到 dl.queue 的延迟消息: {}", msg);
}
```



```java
    @Bean
    public DirectExchange ttlDirectExchange(){
        return new DirectExchange("ttl.direct");
    }

    @Bean
    public Queue ttlQueue(){
        return QueueBuilder
                .durable("ttl.queue")
                .ttl(10000)
                .deadLetterExchange("dl.direct")
                .deadLetterRoutingKey("dl")
                .build();
    }

    @Bean
    public Binding ttlBinding(){
        return BindingBuilder.bind(ttlQueue()).to(ttlDirectExchange()).with("ttl");
    }
```

发送消息时，给消息本身设置超时时间

```java
    @Test
    public void testTTLMessage() {
        // 1.准备消息
        Message message = MessageBuilder
                .withBody("hello, ttl messsage".getBytes(StandardCharsets.UTF_8))
                .setDeliveryMode(MessageDeliveryMode.PERSISTENT)
                .setExpiration("5000")
                .build();
        // 2.发送消息
        rabbitTemplate.convertAndSend("ttl.direct", "ttl", message);
        // 3.记录日志
        log.info("消息已经成功发送！");
    }
```

消息超时的两种方式是？

- 给队列设置ttl属性，进入队列后超过ttl时间的消息变为死信
- 给消息设置ttl属性，队列接收到消息超过ttl时间后为死信
- 两者共存时，以时间短的ttl为准

如果实现发送一个消息20秒后消费者才收到消息？

- 给消息的目标队列指定死信交换机
- 消费者监听与死信交换机绑定的队列
- 发送消息时给消息设置ttl为20秒

### 延迟队列

利用TTL结合死信交换机，我们实现了消息发出后，消费者延迟收到消息的效果。这种消息模式就称为延迟队列(Delay Queue)模式

延迟队列的使用场景包括：

- 延迟发送短信
- 用户下单，如果用户在15分钟内未支付，则自动取消
- 预约工作会议，20分钟后自动通知所有参会人员

#### 延迟队列插件

因为延迟队列的需求很多，所以RabbitMQ的官方也推出了一个插件，原生支持延迟队列效果

官方的安装指南地址为：https://blog.rabbitmq.com/posts/2015/04/scheduling-messages-with-rabbitmq

上述文档是基于linux原生安装RabbitMQ，然后安装插件。



因为我们之前是基于Docker安装RabbitMQ，所以下面我们会讲解基于Docker来安装RabbitMQ插件。

###### 下载插件

RabbitMQ有一个官方的插件社区，地址为：https://www.rabbitmq.com/community-plugins.html

其中包含各种各样的插件，包括我们要使用的DelayExchange插件：

![image-20210713104511055](/images/RabbitMQ/assets/image-20210713104511055.png)



大家可以去对应的GitHub页面下载3.8.9版本的插件，地址为https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/tag/3.8.9这个对应RabbitMQ的3.8.5以上版本。



课前资料也提供了下载好的插件：

![image-20210713104808909](/images/RabbitMQ/assets/image-20210713104808909.png)

###### 上传插件

因为我们是基于Docker安装，所以需要先查看RabbitMQ的插件目录对应的数据卷。如果不是基于Docker的同学，请参考第一章部分，重新创建Docker容器。

我们之前设定的RabbitMQ的数据卷名称为`mq-plugins`，所以我们使用下面命令查看数据卷：

```sh
docker volume inspect mq-plugins
```

可以得到下面结果：

![image-20210713105135701](/images/RabbitMQ/assets/image-20210713105135701.png)

接下来，将插件上传到这个目录即可：

![image-20210713105339785](/images/RabbitMQ/assets/image-20210713105339785.png)



###### 安装插件

最后就是安装了，需要进入MQ容器内部来执行安装。我的容器名为`mq`，所以执行下面命令：

```sh
docker exec -it mq bash
```

执行时，请将其中的 `-it` 后面的`mq`替换为你自己的容器名.

进入容器内部后，执行下面命令开启插件：

```sh
rabbitmq-plugins enable rabbitmq_delayed_message_exchange
```

结果如下：

![image-20210713105829435](/images/RabbitMQ/assets/image-20210713105829435.png)

#### SpringAMQP使用延迟队列插件

DelayExchange的本质还是官方的三种交换机，只是添加了延迟功能。因此使用时只需要声明一个交换机，交换机的类型可以是任意类型，然后设定delayed属性为true即可。

```java
    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(name = "delay.queue", durable = "true"),
            exchange = @Exchange(name = "delay.direct", delayed = "true"),
            key = "delay"
    ))
    public void listenDelayExchange(String msg) {
        log.info("消费者接收到了delay.queue的延迟消息");
    }
```

使用：

```java
    public void testSendDelayMessage() throws InterruptedException {
        // 1.准备消息
        Message message = MessageBuilder
                .withBody("hello, ttl messsage".getBytes(StandardCharsets.UTF_8))
                .setDeliveryMode(MessageDeliveryMode.PERSISTENT)
                .setHeader("x-delay", 5000)
                .build();
        // 2.准备CorrelationData
        CorrelationData correlationData = new CorrelationData(UUID.randomUUID().toString());
        // 3.发送消息
        rabbitTemplate.convertAndSend("delay.direct", "delay", message, correlationData);

        log.info("发送消息成功");
    }
```

由于延迟交换机是帮忙把消息存起来了，没有做转发，消息没有到队列，所以就会报错，因此需要判断是否为延迟消息：

```java
            // 判断是否是延迟消息
            Integer receivedDelay = message.getMessageProperties().getReceivedDelay();
            if (receivedDelay != null && receivedDelay > 0) {
                // 是一个延迟消息，忽略这个错误提示
                return;
            }
```

延迟队列插件的使用步骤：

- 声明一个交换机，添加delayed属性为true
- 发送消息时，添加x-delay头，值为超时时间

## 惰性队列

### 消息堆积问题

当生产者发送消息的速度超过了消费者处理消息的速度，就会导致队列中的消息堆积，直到队列存储消息达到上限。最早接收到的消息，可能就会成为死信，会被丢弃，这就是消息堆积问题

解决消息堆积有三种思路：

- 增加更多消费者，提高消费速度
- 在消费者内开启线程池加快消息处理速度
- 扩大队列容积，提高堆积上限

### 惰性队列

特征如下：

- 接收到消息后直接存入磁盘而非内存
- 消费者要消费消息时才会从磁盘中读取并加载到内存
- 支持数百万条的消息存储

要设置一个队列为惰性队列，只需要在声明队列时，指定x-queue-mode属性为lazy即可。可以通过命令行将一个运行中的队列修改为惰性队列：

```java
rabbitmqctl set_policy Lazy "^lazy-queue$" '{"queue-mode":"lazy"}' --apply-to queues
```

用SpringAMQP声明惰性队列分两种方式：

- @Bean的方式

  - ```java
    @Bean
    public Queue lazyQueue(){
        retrun QueueBuilder
            .durable("lazy.queue")
            .lazy() //开启x-queue-mode为lazy
            .build();
    }
    ```

- 注解方式：

  - ```java
    @RabbitListener(queueToDeclare = @Queue()
                   name = "lazy.queue",
                   durable = "true",
                   arguments = @Argument(name = "x-queue-mode",value = "lazy"))
    public void listenLazyQueue(String msg){
        log.info("接收到 lazy.queue的消息：{}",msg)；
    }
    ```

#### 消息堆积问题的解决方案？

- 队列上绑定多个消费者，提高消费速度
- 给消费者开启线程池，提高消费速度
- 使用惰性队列，可以再mq中保存更多消息

#### 惰性队列的有点有哪些？

- 基于磁盘存储，消息上限高
- 没有间歇性的page-out，性能比较稳定

#### 惰性队列的缺点有那些？

- 基于磁盘存储，消息时效性会降低
- 性能受限于磁盘的IO

## MQ集群

### 集群分类

RabbitMQ的集群有两种模式：

- 普通集群：一种**分布式集群**，将队列分散到集群的各个节点，从而提高整个集群的并发能力
- 镜像集群：一种**主从集群**，普通集群的基础上，添加了主从备份功能，提高集群的数据可用性

镜像集群虽然支持主从，但主从同步并不是强一致，某些情况下可能有数据丢失的风险。因此rabbitmq的3.8版本推出了：仲裁队列来代替镜像集群，底层采用Raft协议确保主从的数据一致性。

### 普通集群

普通集群又称为：标准集群，具备以下特征：

- 会在集群的各个节点间共享部分数据，包括：交换机、**队列元信息**。不包含队列中的消息
  - 队列元信息：主要是当mq集群当中的队列各不相同的时候，其他的集群也会有这个队列的描述![image-20260824152637990](/images/RabbitMQ/image-20260824152637990.png)
- 会访问集群某节点时，如果队列不在该节点，会从数据所在节点传递到当前节点并返回
- 队列所在节点宕机，队列中的消息就会丢失

#### 集群部署

我们先来看普通模式集群，我们的计划部署3节点的mq集群：

| 主机名 | 控制台端口      | amqp通信端口    |
| ------ | --------------- | --------------- |
| mq1    | 8081 ---> 15672 | 8071 ---> 5672  |
| mq2    | 8082 ---> 15672 | 8072 ---> 5672  |
| mq3    | 8083 ---> 15672 | 8073  ---> 5672 |

集群中的节点标示默认都是：`rabbit@[hostname]`，因此以上三个节点的名称分别为：

- rabbit@mq1
- rabbit@mq2
- rabbit@mq3

##### 获取cookie

RabbitMQ底层依赖于Erlang，而Erlang虚拟机就是一个面向分布式的语言，默认就支持集群模式。集群模式中的每个RabbitMQ 节点使用 cookie 来确定它们是否被允许相互通信。

要使两个节点能够通信，它们必须具有相同的共享秘密，称为**Erlang cookie**。cookie 只是一串最多 255 个字符的字母数字字符。

每个集群节点必须具有**相同的 cookie**。实例之间也需要它来相互通信。

我们先在之前启动的mq容器中获取一个cookie值，作为集群的cookie。执行下面的命令：

```sh
docker exec -it mq cat /var/lib/rabbitmq/.erlang.cookie
```

可以看到cookie值

接下来，停止并删除当前的mq容器，我们重新搭建集群。

```sh
docker rm -f mq
```



![image-20210717212345165](/images/RabbitMQ/assets/image-20210717212345165.png)



##### 准备集群配置

在/tmp目录新建一个配置文件 rabbitmq.conf：

```sh
cd /tmp
# 创建文件
touch rabbitmq.conf
```

文件内容如下：

```nginx
loopback_users.guest = false
listeners.tcp.default = 5672
cluster_formation.peer_discovery_backend = rabbit_peer_discovery_classic_config
cluster_formation.classic_config.nodes.1 = rabbit@mq1
cluster_formation.classic_config.nodes.2 = rabbit@mq2
cluster_formation.classic_config.nodes.3 = rabbit@mq3
```

再创建一个文件，记录cookie

```sh
cd /tmp
# 创建cookie文件
touch .erlang.cookie
# 写入cookie
echo "<cookie值>" > .erlang.cookie
# 修改cookie文件的权限
chmod 600 .erlang.cookie
```

准备三个目录,mq1、mq2、mq3：

```sh
cd /tmp
# 创建目录
mkdir mq1 mq2 mq3
```

然后拷贝rabbitmq.conf、cookie文件到mq1、mq2、mq3：

```sh
# 进入/tmp
cd /tmp
# 拷贝
cp rabbitmq.conf mq1
cp rabbitmq.conf mq2
cp rabbitmq.conf mq3
cp .erlang.cookie mq1
cp .erlang.cookie mq2
cp .erlang.cookie mq3
```

##### 启动集群

创建一个网络：

```sh
docker network create mq-net
```

docker volume create 

运行命令

```sh
docker run -d --net mq-net \
-v ${PWD}/mq1/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf \
-v ${PWD}/.erlang.cookie:/var/lib/rabbitmq/.erlang.cookie \
-e RABBITMQ_DEFAULT_USER=itcast \
-e RABBITMQ_DEFAULT_PASS=123321 \
--name mq1 \
--hostname mq1 \
-p 8071:5672 \
-p 8081:15672 \
rabbitmq:3.8-management
```



```sh
docker run -d --net mq-net \
-v ${PWD}/mq2/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf \
-v ${PWD}/.erlang.cookie:/var/lib/rabbitmq/.erlang.cookie \
-e RABBITMQ_DEFAULT_USER=itcast \
-e RABBITMQ_DEFAULT_PASS=123321 \
--name mq2 \
--hostname mq2 \
-p 8072:5672 \
-p 8082:15672 \
rabbitmq:3.8-management
```



```sh
docker run -d --net mq-net \
-v ${PWD}/mq3/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf \
-v ${PWD}/.erlang.cookie:/var/lib/rabbitmq/.erlang.cookie \
-e RABBITMQ_DEFAULT_USER=itcast \
-e RABBITMQ_DEFAULT_PASS=123321 \
--name mq3 \
--hostname mq3 \
-p 8073:5672 \
-p 8083:15672 \
rabbitmq:3.8-management
```

##### 测试

在mq1这个节点上添加一个队列：

![image-20210717222833196](/images/RabbitMQ/assets/image-20210717222833196.png)

如图，在mq2和mq3两个控制台也都能看到：

![image-20210717223057902](/images/RabbitMQ/assets/image-20210717223057902.png)

###### 数据共享测试

点击这个队列，进入管理页面：

![image-20210717223421750](/images/RabbitMQ/assets/image-20210717223421750.png)

然后利用控制台发送一条消息到这个队列：

![image-20210717223320238](/images/RabbitMQ/assets/image-20210717223320238.png)

结果在mq2、mq3上都能看到这条消息：

![image-20210717223603628](/images/RabbitMQ/assets/image-20210717223603628.png)

###### 可用性测试

我们让其中一台节点mq1宕机：

```sh
docker stop mq1
```

然后登录mq2或mq3的控制台，发现simple.queue也不可用了：

![image-20210717223800203](/images/RabbitMQ/assets/image-20210717223800203.png)

说明数据并没有拷贝到mq2和mq3。

### 镜像集群

本质是**主从模式**，具备下面的特征：

- 交换机、队列、队列中的消息会在各个mq的镜像节点之间同步备份
- 创建队列的节点被称为该队列的**主节点**，备份到的其他节点叫做该队列的**镜像节点**

- 一个队列的主节点可能是另一个队列的镜像节点
- 所有操作都是主节点完成，然后同步给镜像节点
- 主宕机后，镜像节点会替代成新的主

![image-20260824161902678](/images/RabbitMQ/image-20260824161902678.png)

#### 镜像模式的特征

默认情况下，队列只保存在创建该队列的节点上。而镜像模式下，创建队列的节点被称为该队列的**主节点**，队列还会拷贝到集群中的其它节点，也叫做该队列的**镜像**节点。

但是，不同队列可以在集群中的任意节点上创建，因此不同队列的主节点可以不同。甚至，**一个队列的主节点可能是另一个队列的镜像节点**。

用户发送给队列的一切请求，例如发送消息、消息回执默认都会在主节点完成，如果是从节点接收到请求，也会路由到主节点去完成。**镜像节点仅仅起到备份数据作用**。

当主节点接收到消费者的ACK时，所有镜像都会删除节点中的数据。



总结如下：

- 镜像队列结构是一主多从（从就是镜像）
- 所有操作都是主节点完成，然后同步给镜像节点
- 主宕机后，镜像节点会替代成新的主（如果在主从同步完成前，主就已经宕机，可能出现数据丢失）
- 不具备负载均衡功能，因为所有操作都会有主节点完成（但是不同队列，其主节点可以不同，可以利用这个提高吞吐量）



#### 镜像模式的配置

镜像模式的配置有3种模式：

| ha-mode         | ha-params         | 效果                                                         |
| :-------------- | :---------------- | :----------------------------------------------------------- |
| 准确模式exactly | 队列的副本量count | 集群中队列副本（主服务器和镜像服务器之和）的数量。count如果为1意味着单个副本：即队列主节点。count值为2表示2个副本：1个队列主和1个队列镜像。换句话说：count = 镜像数量 + 1。如果群集中的节点数少于count，则该队列将镜像到所有节点。如果有集群总数大于count+1，并且包含镜像的节点出现故障，则将在另一个节点上创建一个新的镜像。 |
| all             | (none)            | 队列在群集中的所有节点之间进行镜像。队列将镜像到任何新加入的节点。镜像到所有节点将对所有群集节点施加额外的压力，包括网络I / O，磁盘I / O和磁盘空间使用情况。推荐使用exactly，设置副本数为（N / 2 +1）。 |
| nodes           | *node names*      | 指定队列创建到哪些节点，如果指定的节点全部不存在，则会出现异常。如果指定的节点在集群中存在，但是暂时不可用，会创建节点到当前客户端连接到的节点。 |

这里我们以rabbitmqctl命令作为案例来讲解配置语法。

语法示例：

##### exactly模式

```
rabbitmqctl set_policy ha-two "^two\." '{"ha-mode":"exactly","ha-params":2,"ha-sync-mode":"automatic"}'
```

- `rabbitmqctl set_policy`：固定写法
- `ha-two`：策略名称，自定义
- `"^two\."`：匹配队列的正则表达式，符合命名规则的队列才生效，这里是任何以`two.`开头的队列名称
- `'{"ha-mode":"exactly","ha-params":2,"ha-sync-mode":"automatic"}'`: 策略内容
  - `"ha-mode":"exactly"`：策略模式，此处是exactly模式，指定副本数量
  - `"ha-params":2`：策略参数，这里是2，就是副本数量为2，1主1镜像
  - `"ha-sync-mode":"automatic"`：同步策略，默认是manual，即新加入的镜像节点不会同步旧的消息。如果设置为automatic，则新加入的镜像节点会把主节点中所有消息都同步，会带来额外的网络开销

##### all模式

```
rabbitmqctl set_policy ha-all "^all\." '{"ha-mode":"all"}'
```

- `ha-all`：策略名称，自定义
- `"^all\."`：匹配所有以`all.`开头的队列名
- `'{"ha-mode":"all"}'`：策略内容
  - `"ha-mode":"all"`：策略模式，此处是all模式，即所有节点都会称为镜像节点

##### nodes模式

```
rabbitmqctl set_policy ha-nodes "^nodes\." '{"ha-mode":"nodes","ha-params":["rabbit@nodeA", "rabbit@nodeB"]}'
```

- `rabbitmqctl set_policy`：固定写法
- `ha-nodes`：策略名称，自定义
- `"^nodes\."`：匹配队列的正则表达式，符合命名规则的队列才生效，这里是任何以`nodes.`开头的队列名称
- `'{"ha-mode":"nodes","ha-params":["rabbit@nodeA", "rabbit@nodeB"]}'`: 策略内容
  - `"ha-mode":"nodes"`：策略模式，此处是nodes模式
  - `"ha-params":["rabbit@mq1", "rabbit@mq2"]`：策略参数，这里指定副本所在节点名称



#### 测试

我们使用exactly模式的镜像，因为集群节点数量为3，因此镜像数量就设置为2.



运行下面的命令：

```sh
docker exec -it mq1 rabbitmqctl set_policy ha-two "^two\." '{"ha-mode":"exactly","ha-params":2,"ha-sync-mode":"automatic"}'
```



下面，我们创建一个新的队列：

![image-20210717231751411](/images/RabbitMQ/assets/image-20210717231751411.png)



在任意一个mq控制台查看队列：

![image-20210717231829505](/images/RabbitMQ/assets/image-20210717231829505.png)



##### 测试数据共享

给two.queue发送一条消息：

![image-20210717231958996](/images/RabbitMQ/assets/image-20210717231958996.png)



然后在mq1、mq2、mq3的任意控制台查看消息：

![image-20210717232108584](/images/RabbitMQ/assets/image-20210717232108584.png)





##### 测试高可用

现在，我们让two.queue的主节点mq1宕机：

```sh
docker stop mq1
```



查看集群状态：

![image-20210717232257420](/images/RabbitMQ/assets/image-20210717232257420.png)



查看队列状态：

![image-20210717232322646](/images/RabbitMQ/assets/image-20210717232322646.png)

发现依然是健康的！并且其主节点切换到了rabbit@mq2上

### 仲裁队列

用来替代镜像队列，具备以下特征：

- 与镜像队列一样，都是主从模式，支持主从数据同步
- 使用非常简单，没有复杂的配置
- 主从同步基于Raft协议，强一致

#### 添加仲裁队列

在任意控制台添加一个队列，一定要选择队列类型为Quorum类型。

![image-20210717234329640](/images/RabbitMQ/assets/image-20210717234329640.png)

在任意控制台查看队列：

![image-20210717234426209](/images/RabbitMQ/assets/image-20210717234426209.png)

可以看到，仲裁队列的 + 2字样。代表这个队列有2个镜像节点。

因为仲裁队列默认的镜像数为5。如果你的集群有7个节点，那么镜像数肯定是5；而我们集群只有3个节点，因此镜像数量就是3.

#### 测试

可以参考对镜像集群的测试，效果是一样的。

#### 集群扩容

##### 加入集群

1）启动一个新的MQ容器：

```sh
docker run -d --net mq-net \
-v ${PWD}/.erlang.cookie:/var/lib/rabbitmq/.erlang.cookie \
-e RABBITMQ_DEFAULT_USER=itcast \
-e RABBITMQ_DEFAULT_PASS=123321 \
--name mq4 \
--hostname mq5 \
-p 8074:15672 \
-p 8084:15672 \
rabbitmq:3.8-management
```

2）进入容器控制台：

```sh
docker exec -it mq4 bash
```

3）停止mq进程

```sh
rabbitmqctl stop_app
```



4）重置RabbitMQ中的数据：

```sh
rabbitmqctl reset
```



5）加入mq1：

```sh
rabbitmqctl join_cluster rabbit@mq1
```



6）再次启动mq进程

```sh
rabbitmqctl start_app
```

![image-20210718001909492](/images/RabbitMQ/assets/image-20210718001909492.png)



##### 增加仲裁队列副本

我们先查看下quorum.queue这个队列目前的副本情况，进入mq1容器：

```sh
docker exec -it mq1 bash
```

执行命令：

```sh
rabbitmq-queues quorum_status "quorum.queue"
```

结果：

![image-20210718002118357](/images/RabbitMQ/assets/image-20210718002118357.png)

现在，我们让mq4也加入进来：

```sh
rabbitmq-queues add_member "quorum.queue" "rabbit@mq4"
```

结果：

![image-20210718002253226](/images/RabbitMQ/assets/image-20210718002253226.png)



再次查看：

```sh
rabbitmq-queues quorum_status "quorum.queue"
```

![image-20210718002342603](/images/RabbitMQ/assets/image-20210718002342603.png)



查看控制台，发现quorum.queue的镜像数量也从原来的 +2 变成了 +3：

![image-20210718002422365](/images/RabbitMQ/assets/image-20210718002422365.png)

#### SpringAMQP创建仲裁队列：

```java
    @Bean
    public Queue quorumQueue() {
        return QueueBuilder.durable("quorum.queue2").quorum().build();
    }
```

SpringAMQP连接集群，只需要在yaml中配置即可：

```java
spring:
  rabbitmq:
    addresses: 192.168.150.101:8071, 192.168.150.101:8072, 192.168.150.101:8073
    username: guest
    password: guest
    virtual-host: /
    listener:
      simple:
        prefetch: 1
        acknowledge-mode: auto
        retry:
          enabled: true           #开启消费者失败重试机制
          initial-interval: 1000  #初始的失败等待时长为1秒
          multiplier: 3           #下次失败的等待时长倍数，下次等待时长 = multiplier * last-interval
          max-attempts: 4         #最大重试次数
          stateless: true         #true无状态；false有状态。如果业务中包含十五，这里改为false
```

