@(MarkDown)
###手写JS问题
---
#####函数节流 throttle
throttle 策略的电梯。保证如果电梯第一个人进来后，50毫秒后准时运送一次，不等待。如果没有人，则待机。

	let throttle = (fn, delay = 50) => { // 节流 控制执行间隔时间 防止频繁触发 scroll resize mousemove
     let stattime = 0;
     return function (...args) {
         let curTime = new Date();
         if (curTime - stattime >= delay) {
             fn.apply(this, args);
             stattime = curTime;
	         }
	     }
	 }
<br/>

#####防抖动 debounce
debounce 策略的电梯。如果电梯里有人进来，等待50毫秒。如果又人进来，50毫秒等待重新计时，直到50毫秒超时，开始运送。
	
	 let debounce = (fn, time = 50) => { // 防抖动 控制空闲时间 用户输入频繁
      let timer;
      return function (...args) {
          let that = this;
          clearTimeout(timer);
          timer = setTimeout(fn.bind(that, ...args), time);
	      }
	  }

#####Function的bind实现

	Function.prototype._bind = function (context) {
		let func = this
		let params = [].slice.call(arguments, 1)
		return function () {
			params = params.concat([].slice.call(arguments, 0))
			func.apply(context, params)
		}
	}
<br/>
#####函数组合串联compose（koa reduce中间件）

	// 组合串联
	let fn1 = (a) => a + 1;
	let fn2 = (b) => b + 2;
	let fn3 = (c) => c + 3;
	
	let funs = [fn1, fn2, fn3];
	
	let compose = (func) => {
	    return arg => func.reduceRight((composed, fn) => fn(composed), arg);
	}
	console.log(compose(funs)(100)); // 相当于fn1(fn2(fn3(100)))
<br/>

#####数组展平

	let arr = [[1, 2], 3, [[[4], 5]]]; // 数组展平
	function flatten(arr) {
	    return [].concat(
	        ...arr.map(x => Array.isArray(x) ? flatten(x) : x)
	    )
	}
<br/>

#####插入排序
> 插入排序 从后往前比较 直到碰到比当前项 还要小的前一项时 将这一项插入到前一项的后面

	function insertSort(arr) {
	  let len = arr.length;
	  let preIndex, current;
	  for (let i = 1; i < len; i++) {
	    preIndex = i - 1;
	    current = arr[i]; // 当前项
	    while (preIndex >= 0 && arr[preIndex] > current) {
	      arr[preIndex + 1] = arr[preIndex]; // 如果前一项大于当前项 则把前一项往后挪一位
	      preIndex-- // 用当前项继续和前面值进行比较
	    }
	    arr[preIndex + 1] = current; // 如果前一项小于当前项则 循环结束 则将当前项放到 前一项的后面
	  }
	  return arr;
	}
	
<br/>
#####选择排序
> 选择排序 每次拿当前项与后面其他项进行比较 得到最小值的索引位置 然后把最小值和当前项交换位置

	function selectSort(arr) {
	  let len = arr.length;
	  let temp = null;
	  let minIndex = null;
	  for (let i = 0; i < len - 1; i++) { // 把当前值的索引作为最小值的索引一次去比较
	    minIndex = i; // 假设当前项索引 为最小值索引
	    for (let j = i + 1; j < len; j++) { // 当前项后面向一次比小
	      if (arr[j] < arr[minIndex]) { // 比假设的值还要小 则保留最小值索引
	        minIndex = j; // 找到最小值的索引位置
	      }
	    }
	    // 将当前值和比较出的最小值交换位置
	    if (i !== minIndex) {
	       temp = arr[i]
	       arr[i] = arr[minIndex];
	       arr[minIndex] = temp;
	    }
	  }
	  return arr;
	}
<br/>

#####冒泡排序
> 冒泡排序 相邻两项进行比较 如果当前值大于后一项 则交换位置  

<br />

#####快速排序（递归）


	function quickSort(arr) {
    if (arr.length <= 1) return arr;
    let midIndex = Math.floor(arr.length / 2);
    let midNum = arr.splice(midIndex, 1)[0];
    let left = [];
    let right = [];
    for(let i = 0; i < arr.length; i++) {
        let cur = arr[i];
        if (cur <= midNum) {
            left.push(cur);
        } else {
            right.push(cur);
        }
    }
    return quickSort(left).concat(midNum, quickSort(right));
	}
	
	let arr = [2, 4, 12, 9, 22, 10, 18, 6];
	quickSort(arr);

<br/>

#####数组去重的几种方法


	// 1  es6
	let newArr = [...new Set(arr)];
	// 2  
	Array.prototype.unique2 = function() {
    let newArr = [];
    let len = this.length;
    for(let i = 0; i < len; i++) {
        let cur = this[i];
        if(newArr.indexOf(cur) === -1) {
            newArr[newArr.length] = cur;
        }
    }
    return newArr;
	}
	console.log(arr.unique1());
	// 3 最快
	Array.prototype.unique4 = function() {
    let json = {}, newArr = [], len = this.length;
    for(var i = 0; i < len; i++) {
        let cur = this[i];
        if (typeof json[cur] == "undefined") {
            json[cur] = true;
            newArr.push(cur)
        }
    }
    return newArr;
	}
	console.log(arr.unique4());

#####千叶符

	 let str1 = '2123456789';
    let str2 = '2123456789.12';

    // 利用正向预查 匹配 开头一个数字\d 后面匹配这个数字后面必须是三个数字为一组为结尾或小数为结尾
    function thousandth(str) { 
        let reg = /\d(?=(?:\d{3})+(?:\.\d+|$))/g; 
        return str.replace(reg, (...rest) => rest[0] + ',');
    }
    console.log(thousandth(str1)); // 2,123,456,789
    console.log(thousandth(str2)); // 2,123,456,789.12

答案:

		str.replace(/(\d)(?=(?:\d{3})+$)/g, ' $1,')