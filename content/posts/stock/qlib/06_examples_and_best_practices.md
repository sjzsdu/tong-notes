# Qlib 使用指南和最佳实践

## 1. 快速入门指南

### 1.1 环境准备和安装

```bash
# 1. 安装 Qlib
pip install pyqlib

# 2. 下载示例数据
python -c "
import qlib
from qlib.tests.data import GetData
from qlib.constant import REG_CN

# 下载中国市场数据
GetData().qlib_data(target_dir='~/.qlib/qlib_data/cn_data', region=REG_CN)
"

# 3. 验证安装
python -c "
import qlib
qlib.init(provider_uri='~/.qlib/qlib_data/cn_data', region='cn')
print('Qlib 安装成功！')
"
```

### 1.2 第一个量化策略

```python
import qlib
from qlib.constant import REG_CN
from qlib.utils import init_instance_by_config
from qlib.workflow import R

# 1. 初始化 Qlib
qlib.init(provider_uri="~/.qlib/qlib_data/cn_data", region=REG_CN)

# 2. 定义基础配置
basic_config = {
    "model": {
        "class": "LGBModel",
        "module_path": "qlib.contrib.model.gbdt",
        "kwargs": {
            "loss": "mse",
            "learning_rate": 0.1,
            "max_depth": 6,
            "num_leaves": 64,
            "num_threads": 4
        }
    },
    "dataset": {
        "class": "DatasetH", 
        "module_path": "qlib.data.dataset",
        "kwargs": {
            "handler": {
                "class": "Alpha158",
                "module_path": "qlib.contrib.data.handler",
                "kwargs": {
                    "start_time": "2008-01-01",
                    "end_time": "2020-08-01",
                    "fit_start_time": "2008-01-01", 
                    "fit_end_time": "2014-12-31",
                    "instruments": "csi300"
                }
            },
            "segments": {
                "train": ("2008-01-01", "2014-12-31"),
                "valid": ("2015-01-01", "2016-12-31"), 
                "test": ("2017-01-01", "2020-08-01")
            }
        }
    }
}

# 3. 启动实验
with R.start(experiment_name="first_strategy"):
    # 初始化模型和数据集
    model = init_instance_by_config(basic_config["model"])
    dataset = init_instance_by_config(basic_config["dataset"])
    
    # 训练模型
    model.fit(dataset)
    
    # 生成预测
    predictions = model.predict(dataset)
    
    # 保存结果
    R.save_objects(model=model, predictions=predictions)
    print("策略训练完成！")
```

## 2. 配置文件最佳实践

### 2.1 标准配置模板

```yaml
# workflow_config_template.yaml
qlib_init:
    provider_uri: "~/.qlib/qlib_data/cn_data"
    region: cn
    
# 使用锚点定义复用配置
market: &market csi300  
benchmark: &benchmark SH000300

# 数据处理配置
data_handler_config: &data_handler_config
    start_time: 2008-01-01
    end_time: 2020-08-01
    fit_start_time: 2008-01-01
    fit_end_time: 2014-12-31
    instruments: *market
    
    # 特征处理器
    infer_processors:
        - class: RobustZScoreNorm
          kwargs:
            fields_group: feature
            clip_outlier: true
        - class: Fillna
          kwargs:
            fields_group: feature
            
    # 标签处理器  
    learn_processors:
        - class: DropnaLabel
        - class: CSRankNorm
          kwargs:
            fields_group: label

# 组合分析配置
port_analysis_config: &port_analysis_config
    strategy:
        class: TopkDropoutStrategy
        module_path: qlib.contrib.strategy
        kwargs:
            signal: <PRED>
            topk: 50
            n_drop: 5
    backtest:
        start_time: 2017-01-01
        end_time: 2020-08-01
        account: 100000000
        benchmark: *benchmark
        exchange_kwargs:
            limit_threshold: 0.095
            deal_price: close
            open_cost: 0.0005
            close_cost: 0.0015
            min_cost: 5

# 任务配置
task:
    model:
        class: LGBModel
        module_path: qlib.contrib.model.gbdt
        kwargs:
            loss: mse
            colsample_bytree: 0.8879
            learning_rate: 0.2
            subsample: 0.8789
            lambda_l1: 205.6999
            lambda_l2: 580.9768
            max_depth: 8
            num_leaves: 210
            num_threads: 20
            
    dataset:
        class: DatasetH
        module_path: qlib.data.dataset
        kwargs:
            handler:
                class: Alpha158
                module_path: qlib.contrib.data.handler
                kwargs: *data_handler_config
            segments:
                train: [2008-01-01, 2014-12-31]
                valid: [2015-01-01, 2016-12-31] 
                test: [2017-01-01, 2020-08-01]
                
    record:
        - class: SignalRecord
          module_path: qlib.workflow.record_temp
        - class: SigAnaRecord
          module_path: qlib.workflow.record_temp  
        - class: PortAnaRecord
          module_path: qlib.workflow.record_temp
          kwargs: *port_analysis_config
```

### 2.2 环境变量配置

```yaml
# production_config.yaml - 生产环境配置模板
qlib_init:
    provider_uri: "{{ DATA_PATH | default('~/.qlib/qlib_data/cn_data') }}"
    region: "{{ REGION | default('cn') }}"
    
task:
    model:
        class: "{{ MODEL_CLASS | default('LGBModel') }}"
        module_path: qlib.contrib.model.gbdt
        kwargs:
            learning_rate: "{{ LEARNING_RATE | default(0.1) | float }}"
            max_depth: "{{ MAX_DEPTH | default(6) | int }}"
            num_threads: "{{ NUM_THREADS | default(4) | int }}"
```

```bash
# 使用环境变量运行
export DATA_PATH="/data/qlib_data/cn_data"
export MODEL_CLASS="XGBModel" 
export LEARNING_RATE="0.05"
export MAX_DEPTH="8"

qrun production_config.yaml --experiment_name production_run
```

## 3. 模型开发最佳实践

### 3.1 自定义特征工程

```python
from qlib.data.dataset.handler import DataHandlerLP
from qlib.data.dataset.processor import Processor
import pandas as pd
import numpy as np

class CustomFeatureHandler(DataHandlerLP):
    """自定义特征处理器"""
    
    def __init__(self, **kwargs):
        # 定义自定义特征
        fields = [
            # 价格特征
            "Ref($close, 1)/$close - 1",  # 昨日收益率
            "($high + $low) / 2 / $close - 1",  # 中间价偏离
            
            # 成交量特征  
            "Log($volume / Ref($volume, 1))",  # 成交量变化
            "$volume * $close",  # 成交额
            
            # 技术指标
            "($close - Mean($close, 5)) / Std($close, 5)",  # 5日Z-Score
            "($close - Mean($close, 20)) / Std($close, 20)",  # 20日Z-Score
            "RSI($close, 14)",  # RSI指标
            "MACD($close)",  # MACD指标
            
            # 标签：未来5日收益率
            "Ref($close, -5)/$close - 1"
        ]
        
        kwargs.update({
            "fields": fields,
            "label": ["Ref($close, -5)/$close - 1"]
        })
        
        super().__init__(**kwargs)


class OutlierProcessor(Processor):
    """异常值处理器"""
    
    def __init__(self, fields_group="feature", method="clip", **kwargs):
        self.fields_group = fields_group
        self.method = method
        super().__init__(**kwargs)
    
    def __call__(self, df):
        if self.fields_group not in df.columns.names:
            return df
            
        feature_df = df[self.fields_group]
        
        if self.method == "clip":
            # 3σ原则裁剪异常值
            for col in feature_df.columns:
                mean = feature_df[col].mean()
                std = feature_df[col].std()
                lower = mean - 3 * std
                upper = mean + 3 * std
                feature_df[col] = feature_df[col].clip(lower, upper)
        
        elif self.method == "winsorize":
            # 百分位数截尾
            for col in feature_df.columns:
                lower = feature_df[col].quantile(0.01)
                upper = feature_df[col].quantile(0.99)
                feature_df[col] = feature_df[col].clip(lower, upper)
        
        # 更新数据框
        df[self.fields_group] = feature_df
        return df
```

### 3.2 自定义模型实现

```python
from qlib.model.base import Model
from qlib.data.dataset import Dataset
import lightgbm as lgb
import pandas as pd
import numpy as np
from typing import Union, Text

class EnhancedLGBModel(Model):
    """增强版 LightGBM 模型"""
    
    def __init__(self, 
                 loss="mse",
                 early_stopping_rounds=50,
                 num_boost_round=1000,
                 feature_selection=True,
                 ensemble_method="bagging",
                 n_estimators=5,
                 **kwargs):
        
        self.params = {"objective": loss, "verbosity": -1}
        self.params.update(kwargs)
        self.early_stopping_rounds = early_stopping_rounds
        self.num_boost_round = num_boost_round
        self.feature_selection = feature_selection
        self.ensemble_method = ensemble_method
        self.n_estimators = n_estimators
        
        self.models = []
        self.feature_importance = {}
        self.selected_features = None
    
    def fit(self, dataset: Dataset, **kwargs):
        """训练增强模型"""
        # 准备数据
        train_data = dataset.prepare("train", col_set=["feature", "label"])
        valid_data = dataset.prepare("valid", col_set=["feature", "label"])
        
        x_train, y_train = train_data["feature"], train_data["label"]
        x_valid, y_valid = valid_data["feature"], valid_data["label"]
        
        # 特征选择
        if self.feature_selection:
            self.selected_features = self._select_features(x_train, y_train)
            x_train = x_train[self.selected_features]
            x_valid = x_valid[self.selected_features]
        
        # 集成训练
        if self.ensemble_method == "bagging":
            self._train_bagging(x_train, y_train, x_valid, y_valid)
        elif self.ensemble_method == "boosting":
            self._train_boosting(x_train, y_train, x_valid, y_valid)
        else:
            self._train_single(x_train, y_train, x_valid, y_valid)
    
    def _select_features(self, x_train, y_train, top_k=100):
        """特征选择"""
        # 训练临时模型获取特征重要性
        temp_model = lgb.LGBMRegressor(**self.params)
        temp_model.fit(x_train, y_train)
        
        # 获取特征重要性
        importance = pd.Series(
            temp_model.feature_importances_,
            index=x_train.columns
        ).sort_values(ascending=False)
        
        # 选择 top_k 特征
        selected = importance.head(top_k).index.tolist()
        print(f"特征选择：从 {len(x_train.columns)} 个特征中选择了 {len(selected)} 个")
        
        return selected
    
    def _train_bagging(self, x_train, y_train, x_valid, y_valid):
        """Bagging 集成训练"""
        for i in range(self.n_estimators):
            # 随机采样
            sample_idx = np.random.choice(
                len(x_train), 
                size=int(0.8 * len(x_train)), 
                replace=True
            )
            
            x_sample = x_train.iloc[sample_idx]
            y_sample = y_train.iloc[sample_idx]
            
            # 训练模型
            train_ds = lgb.Dataset(x_sample, label=y_sample)
            valid_ds = lgb.Dataset(x_valid, label=y_valid)
            
            model = lgb.train(
                self.params,
                train_ds,
                valid_sets=[valid_ds],
                num_boost_round=self.num_boost_round,
                callbacks=[
                    lgb.early_stopping(self.early_stopping_rounds),
                    lgb.log_evaluation(0)  # 静默训练
                ]
            )
            
            self.models.append(model)
    
    def predict(self, dataset: Dataset, segment: Union[Text, slice] = "test"):
        """集成预测"""
        test_data = dataset.prepare(segment, col_set=["feature"])
        x_test = test_data["feature"]
        
        # 特征选择
        if self.selected_features:
            x_test = x_test[self.selected_features]
        
        # 集成预测
        predictions = []
        for model in self.models:
            pred = model.predict(x_test)
            predictions.append(pred)
        
        # 平均预测结果
        ensemble_pred = np.mean(predictions, axis=0)
        
        return pd.Series(ensemble_pred, index=x_test.index)
    
    def get_feature_importance(self):
        """获取特征重要性"""
        if not self.models:
            return {}
        
        # 计算平均特征重要性
        importance_dict = {}
        for model in self.models:
            for feature, importance in zip(
                self.selected_features or self.models[0].feature_name(),
                model.feature_importance()
            ):
                if feature not in importance_dict:
                    importance_dict[feature] = []
                importance_dict[feature].append(importance)
        
        # 取平均值
        avg_importance = {
            feature: np.mean(importances) 
            for feature, importances in importance_dict.items()
        }
        
        return avg_importance
```

## 4. 策略开发模式

### 4.1 多因子选股策略

```python
from qlib.contrib.strategy.signal_strategy import TopkDropoutStrategy
from qlib.backtest.decision import Order, OrderDir
import pandas as pd
import numpy as np

class MultiFactorStrategy(TopkDropoutStrategy):
    """多因子选股策略"""
    
    def __init__(self, 
                 factors_config,
                 factor_weights=None,
                 rebalance_freq="M",  # 月度调仓
                 **kwargs):
        
        self.factors_config = factors_config
        self.factor_weights = factor_weights or {}
        self.rebalance_freq = rebalance_freq
        self.last_rebalance = None
        
        super().__init__(**kwargs)
    
    def generate_trade_decision(self, execute_result):
        """生成交易决策"""
        current_time = execute_result[0]
        
        # 检查是否需要调仓
        if not self._should_rebalance(current_time):
            return self.get_no_trade_decision()
        
        # 计算综合因子得分
        composite_score = self._calculate_composite_score(current_time)
        
        if composite_score.empty:
            return self.get_no_trade_decision()
        
        # 生成订单
        order_list = self.generate_order_list(
            composite_score, 
            current_time,
            execute_result[1]  # 当前持仓
        )
        
        self.last_rebalance = current_time
        return self.create_trade_decision(order_list, current_time)
    
    def _should_rebalance(self, current_time):
        """判断是否需要调仓"""
        if self.last_rebalance is None:
            return True
        
        if self.rebalance_freq == "D":  # 日度
            return True
        elif self.rebalance_freq == "W":  # 周度
            return current_time.weekday() == 0  # 周一
        elif self.rebalance_freq == "M":  # 月度
            return current_time.day <= 7  # 月初
        else:
            return False
    
    def _calculate_composite_score(self, current_time):
        """计算综合因子得分"""
        factor_scores = {}
        
        # 计算各个因子得分
        for factor_name, factor_config in self.factors_config.items():
            try:
                score = self._calculate_factor_score(
                    factor_name, 
                    factor_config, 
                    current_time
                )
                if score is not None and not score.empty:
                    factor_scores[factor_name] = score
            except Exception as e:
                self.logger.warning(f"因子 {factor_name} 计算失败: {e}")
        
        if not factor_scores:
            return pd.Series()
        
        # 标准化各因子得分
        normalized_scores = {}
        for factor_name, score in factor_scores.items():
            normalized_scores[factor_name] = (score - score.mean()) / score.std()
        
        # 加权合成
        composite_score = pd.Series(0.0, index=list(factor_scores.values())[0].index)
        total_weight = 0
        
        for factor_name, score in normalized_scores.items():
            weight = self.factor_weights.get(factor_name, 1.0)
            composite_score += weight * score
            total_weight += weight
        
        if total_weight > 0:
            composite_score /= total_weight
        
        return composite_score
    
    def _calculate_factor_score(self, factor_name, factor_config, current_time):
        """计算单个因子得分"""
        if factor_config["type"] == "model_prediction":
            # 使用模型预测作为因子
            model = factor_config["model"]
            dataset = factor_config["dataset"]
            
            # 更新数据到当前时间
            dataset.config(
                handler_kwargs={"end_time": current_time}
            )
            
            return model.predict(dataset, segment="test")
        
        elif factor_config["type"] == "technical_indicator":
            # 使用技术指标作为因子
            return self._calculate_technical_factor(
                factor_config, 
                current_time
            )
        
        elif factor_config["type"] == "fundamental":
            # 使用基本面指标作为因子
            return self._calculate_fundamental_factor(
                factor_config, 
                current_time
            )
        
        else:
            raise ValueError(f"未知因子类型: {factor_config['type']}")


class PairsTradingStrategy(BaseStrategy):
    """配对交易策略"""
    
    def __init__(self, 
                 pair_symbols,
                 lookback_window=252,
                 entry_threshold=2.0,
                 exit_threshold=0.5,
                 max_holding_period=20,
                 **kwargs):
        
        self.pair_symbols = pair_symbols  # [("stock_a", "stock_b"), ...]
        self.lookback_window = lookback_window
        self.entry_threshold = entry_threshold
        self.exit_threshold = exit_threshold
        self.max_holding_period = max_holding_period
        
        self.positions = {}  # 当前持仓
        self.entry_dates = {}  # 开仓日期
        
        super().__init__(**kwargs)
    
    def generate_trade_decision(self, execute_result):
        """生成配对交易决策"""
        current_time = execute_result[0]
        order_list = []
        
        for pair in self.pair_symbols:
            stock_a, stock_b = pair
            
            # 计算价差信号
            spread_signal = self._calculate_spread_signal(
                stock_a, stock_b, current_time
            )
            
            if spread_signal is None:
                continue
            
            pair_key = f"{stock_a}_{stock_b}"
            current_position = self.positions.get(pair_key, 0)
            
            # 生成交易信号
            if current_position == 0:
                # 开仓逻辑
                if spread_signal > self.entry_threshold:
                    # 做空价差：卖出A，买入B
                    order_list.extend([
                        Order(stock_a, -100, OrderDir.SELL),
                        Order(stock_b, 100, OrderDir.BUY)
                    ])
                    self.positions[pair_key] = -1
                    self.entry_dates[pair_key] = current_time
                    
                elif spread_signal < -self.entry_threshold:
                    # 做多价差：买入A，卖出B
                    order_list.extend([
                        Order(stock_a, 100, OrderDir.BUY),
                        Order(stock_b, -100, OrderDir.SELL)
                    ])
                    self.positions[pair_key] = 1
                    self.entry_dates[pair_key] = current_time
            
            else:
                # 平仓逻辑
                should_close = (
                    abs(spread_signal) < self.exit_threshold or  # 价差回归
                    self._holding_too_long(pair_key, current_time)  # 持有过久
                )
                
                if should_close:
                    if current_position == 1:
                        # 平多仓
                        order_list.extend([
                            Order(stock_a, -100, OrderDir.SELL),
                            Order(stock_b, 100, OrderDir.BUY)
                        ])
                    else:
                        # 平空仓
                        order_list.extend([
                            Order(stock_a, 100, OrderDir.BUY),
                            Order(stock_b, -100, OrderDir.SELL)
                        ])
                    
                    self.positions[pair_key] = 0
                    del self.entry_dates[pair_key]
        
        return self.create_trade_decision(order_list, current_time)
```

## 5. 生产部署最佳实践

### 5.1 容器化部署

```dockerfile
# Dockerfile
FROM python:3.8-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc g++ \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p /data/qlib_data

# 设置环境变量
ENV QLIB_DATA_PATH=/data/qlib_data
ENV PYTHONPATH=/app

# 暴露端口
EXPOSE 9710

# 启动命令
CMD ["python", "-m", "qlib.contrib.online.server"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  qlib-server:
    build: .
    ports:
      - "9710:9710"
    volumes:
      - ./data:/data/qlib_data
      - ./configs:/app/configs
      - ./models:/app/models
    environment:
      - QLIB_DATA_PATH=/data/qlib_data
      - MONGODB_URI=mongodb://mongo:27017/qlib
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - mongo
      - redis
    
  mongo:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

### 5.2 生产监控配置

```python
# monitoring.py
import logging
import time
from datetime import datetime
import psutil
import pandas as pd
from qlib.workflow import R
from qlib.log import get_module_logger

class ProductionMonitor:
    """生产环境监控"""
    
    def __init__(self, alert_threshold=None):
        self.logger = get_module_logger("ProductionMonitor")
        self.alert_threshold = alert_threshold or {
            "cpu_usage": 80,
            "memory_usage": 80,
            "disk_usage": 90,
            "prediction_latency": 5.0,  # 秒
            "error_rate": 0.05  # 5%
        }
        
        self.metrics_history = []
        self.error_count = 0
        self.total_requests = 0
    
    def monitor_system_resources(self):
        """监控系统资源"""
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        metrics = {
            "timestamp": datetime.now(),
            "cpu_usage": cpu_usage,
            "memory_usage": memory.percent,
            "disk_usage": disk.percent
        }
        
        # 检查告警
        for metric, value in metrics.items():
            if metric.endswith("_usage") and metric in self.alert_threshold:
                if value > self.alert_threshold[metric]:
                    self.send_alert(f"{metric} 超过阈值: {value}%")
        
        return metrics
    
    def monitor_prediction_performance(self, prediction_func):
        """监控预测性能"""
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = prediction_func(*args, **kwargs)
                self.total_requests += 1
                
                latency = time.time() - start_time
                
                # 记录性能指标
                self.record_metrics({
                    "prediction_latency": latency,
                    "prediction_success": True
                })
                
                # 检查延迟告警
                if latency > self.alert_threshold["prediction_latency"]:
                    self.send_alert(f"预测延迟过高: {latency:.2f}秒")
                
                return result
                
            except Exception as e:
                self.error_count += 1
                self.record_metrics({
                    "prediction_error": str(e),
                    "prediction_success": False
                })
                
                # 检查错误率
                error_rate = self.error_count / max(self.total_requests, 1)
                if error_rate > self.alert_threshold["error_rate"]:
                    self.send_alert(f"错误率过高: {error_rate:.2%}")
                
                raise
        
        return wrapper
    
    def record_metrics(self, metrics):
        """记录指标"""
        metrics["timestamp"] = datetime.now()
        self.metrics_history.append(metrics)
        
        # 保持最近1000条记录
        if len(self.metrics_history) > 1000:
            self.metrics_history = self.metrics_history[-1000:]
    
    def send_alert(self, message):
        """发送告警"""
        self.logger.error(f"[ALERT] {message}")
        
        # 这里可以集成钉钉、邮件、短信等告警渠道
        # send_to_dingtalk(message)
        # send_email(message)
    
    def get_health_report(self):
        """获取健康报告"""
        if not self.metrics_history:
            return {"status": "no_data"}
        
        recent_metrics = self.metrics_history[-100:]  # 最近100条
        
        return {
            "status": "healthy" if self.error_count == 0 else "degraded",
            "total_requests": self.total_requests,
            "error_count": self.error_count,
            "error_rate": self.error_count / max(self.total_requests, 1),
            "avg_latency": np.mean([
                m.get("prediction_latency", 0) 
                for m in recent_metrics
            ]),
            "last_update": recent_metrics[-1]["timestamp"] if recent_metrics else None
        }


# 使用示例
monitor = ProductionMonitor()

@monitor.monitor_prediction_performance
def predict_with_monitoring(model, data):
    return model.predict(data)
```

## 6. 性能优化技巧

### 6.1 数据加载优化

```python
# 高效数据加载配置
efficient_config = {
    "dataset": {
        "class": "DatasetH",
        "kwargs": {
            "handler": {
                "class": "Alpha158",
                "kwargs": {
                    # 使用并行加载
                    "n_jobs": 8,
                    # 启用缓存
                    "use_cache": True,
                    # 数据预加载
                    "preload": True,
                    # 内存映射文件
                    "mmap_mode": "r"
                }
            },
            # 数据分片
            "segments_config": {
                "train": ("2008-01-01", "2014-12-31"),
                "valid": ("2015-01-01", "2016-12-31"),
                "test": ("2017-01-01", "2020-08-01")
            }
        }
    }
}
```

### 6.2 模型训练优化

```python
# 高性能训练配置
performance_config = {
    "model": {
        "class": "LGBModel",  
        "kwargs": {
            # 并行训练
            "num_threads": -1,  # 使用所有CPU核心
            "force_row_wise": True,  # 行优先模式
            
            # 内存优化
            "max_bin": 255,  # 减少内存使用
            "feature_fraction": 0.8,  # 特征采样
            "bagging_fraction": 0.8,  # 数据采样
            
            # 早停优化
            "early_stopping_rounds": 50,
            "num_boost_round": 1000,
            
            # GPU 加速（如果可用）
            # "device_type": "gpu",
            # "gpu_platform_id": 0,
            # "gpu_device_id": 0
        }
    }
}
```

## 7. 常见问题和解决方案

### 7.1 内存问题

```python
# 内存优化策略
def optimize_memory_usage():
    """内存使用优化"""
    
    # 1. 清理缓存
    from qlib.data.cache import H
    H.clear()
    
    # 2. 设置内存限制
    import qlib
    qlib.init(
        mem_cache_size_limit="2GB",  # 限制内存缓存
        expression_cache=False,      # 关闭表达式缓存
    )
    
    # 3. 使用数据分片
    def process_data_in_chunks(data, chunk_size=1000):
        for i in range(0, len(data), chunk_size):
            chunk = data[i:i + chunk_size]
            yield process_chunk(chunk)
            del chunk  # 及时释放内存
    
    # 4. 显式垃圾回收
    import gc
    gc.collect()
```

### 7.2 数据问题诊断

```python
def diagnose_data_issues():
    """数据问题诊断"""
    
    import qlib
    from qlib.data import D
    
    # 检查数据完整性
    def check_data_completeness(instruments, start_time, end_time):
        missing_data = {}
        
        for instrument in instruments:
            try:
                data = D.features(
                    [instrument], 
                    ["$close"], 
                    start_time, 
                    end_time
                )
                if data.empty:
                    missing_data[instrument] = "完全缺失"
                elif data.isnull().sum().sum() > 0:
                    missing_data[instrument] = f"部分缺失: {data.isnull().sum().sum()}个"
            except Exception as e:
                missing_data[instrument] = f"读取错误: {e}"
        
        return missing_data
    
    # 检查数据质量
    def check_data_quality(data):
        quality_report = {}
        
        for col in data.columns:
            col_data = data[col].dropna()
            if len(col_data) == 0:
                continue
                
            quality_report[col] = {
                "count": len(col_data),
                "null_ratio": data[col].isnull().sum() / len(data),
                "zero_ratio": (col_data == 0).sum() / len(col_data),
                "infinite_count": np.isinf(col_data).sum(),
                "outlier_ratio": len(col_data[np.abs(col_data - col_data.mean()) > 3 * col_data.std()]) / len(col_data)
            }
        
        return quality_report
```

## 8. 总结

Qlib 提供了完整的量化投资研究和生产部署解决方案。通过遵循本文档的最佳实践，用户可以：

1. **快速入门**：使用标准配置模板快速搭建量化策略
2. **高效开发**：利用模块化设计和工具链提升开发效率  
3. **稳定部署**：采用容器化和监控方案确保生产稳定性
4. **持续优化**：通过性能调优和问题诊断持续改进系统

Qlib 的设计理念是让量化研究者能够专注于策略本身，而将基础设施的复杂性抽象化。无论是学术研究还是工业应用，Qlib 都能提供强大而灵活的支持。