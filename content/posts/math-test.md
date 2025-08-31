---
title: "数学公式测试页面"
date: 2025-08-30T23:04:28+08:00
draft: false
description: "数学公式测试页面"
tags: 
  - "文档"
categories:
  - "技术"
---

---
title: "数学公式测试页面"
date: 2025-01-15
description: "测试数学公式渲染效果"
tags: ["测试", "数学公式"]
categories: ["测试"]
math: true
draft: false
---

# 数学公式测试页面

## 行内公式测试

这是一个行内公式：$E = mc^2$，还有一个复杂的：$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$

## 块级公式测试

### 麦克斯韦方程组

$$\nabla \cdot \vec{D} = \rho$$

$$\nabla \cdot \vec{B} = 0$$

$$\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}$$

$$\nabla \times \vec{H} = \vec{J} + \frac{\partial \vec{D}}{\partial t}$$

### 薛定谔方程

$$i\hbar\frac{\partial}{\partial t}\Psi(\mathbf{r},t) = \hat{H}\Psi(\mathbf{r},t)$$

### 矩阵表示

$$\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}$$

### 求和公式

$$\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}$$

### 积分公式

$$\int_0^1 x^n dx = \frac{1}{n+1}$$

### 希腊字母和特殊符号

$$\alpha, \beta, \gamma, \delta, \epsilon, \zeta, \eta, \theta, \iota, \kappa, \lambda, \mu, \nu, \xi, \omicron, \pi, \rho, \sigma, \tau, \upsilon, \phi, \chi, \psi, \omega$$

$$\Gamma, \Delta, \Theta, \Lambda, \Xi, \Pi, \Sigma, \Upsilon, \Phi, \Psi, \Omega$$

### 复杂的长公式

$$\int_{-\infty}^{\infty} \frac{e^{-x^2/2}}{\sqrt{2\pi}} \left[ \sum_{n=0}^{\infty} \frac{a_n}{n!} H_n(x) \right] dx = \sum_{n=0}^{\infty} \frac{a_n}{n!} \int_{-\infty}^{\infty} \frac{e^{-x^2/2}}{\sqrt{2\pi}} H_n(x) dx$$

## 物理公式示例

### 量子力学

波函数归一化条件：
$$\int_{-\infty}^{\infty} |\Psi(x,t)|^2 dx = 1$$

不确定性原理：
$$\Delta x \Delta p \geq \frac{\hbar}{2}$$

### 电磁学

坡印廷矢量：
$$\vec{S} = \frac{1}{\mu_0} \vec{E} \times \vec{B}$$

### 热力学

熵的统计定义：
$$S = k_B \ln \Omega$$

玻尔兹曼分布：
$$P(E) = \frac{1}{Z} e^{-E/k_B T}$$

其中配分函数：
$$Z = \sum_i e^{-E_i/k_B T}$$
