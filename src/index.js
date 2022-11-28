

/**
 * @param {HTMLElement} element 绑定事件的元素
 * @param {object} options 配置项
 */

class PCGesture{
    constructor(imgEl,windowEl){
        this.imgEl=imgEl
        this.windowEl=windowEl
        //视口宽高
        this.windowWidth=windowEl.offsetWidth
        this.windowHeight=windowEl.offsetHeight
        //图片原始宽高
        this.imgNaturalWidth=imgEl.naturalWidth
        this.imgNaturalHeight=imgEl.naturalHeight
        //图片初始宽高
        this.defaultImgSize={
            width:0,
            height:0,
        }
        //移动缩放信息
        this.transferInfo={
            x:0,
            y:0,
            scale:1,
        }
        //最大缩放比
        this.maxScale=0
        //最小缩放比
        this.minScale=0.5
        //滚轮缩放step
        this.step=0.1
        //鼠标最新落点
        this.lastPoint={
            x:0,
            y:0
        }
        this.transition='none'
        this.bindEventListener()
    }
    /**
     * 
     * 获取初始化图片宽高
     */
    initImage(){
        //计算图片和视口宽高比
        const {imgNaturalWidth,imgNaturalHeight,windowWidth,windowHeight}=this
        const imgRatio=imgNaturalWidth/imgNaturalHeight
        const windowRatio=windowWidth/windowHeight
        let width
        let height
        if(imgRatio>=windowRatio){
            if(imgNaturalWidth>windowWidth){
                width=windowWidth
                height=(width/imgNaturalWidth)*imgNaturalHeight
            }else{
                width=imgNaturalWidth
                height=imgNaturalHeight
            }
        }else{
            if(imgNaturalHeight>windowHeight){
                height=windowHeight
                width=(height/imgNaturalHeight)*imgNaturalWidth
            }else{
                height=imgNaturalHeight
                width=imgNaturalWidth
            }
        }
        return {width,height}
    }

    /**
     * 
     * 初始化图片宽高以及位置
     */
    init(){
        const {imgEl}=this
        const {imgNaturalWidth,imgNaturalHeight,windowWidth,windowHeight}=this
         //初始化图片宽高
        this.defaultImgSize=this.initImage()
        imgEl.style.width = this.defaultImgSize.width + 'px'
        imgEl.style.height = this.defaultImgSize.height + 'px'
        //计算图片初始位置
        this.transferInfo.x = (windowWidth - this.defaultImgSize.width) * 0.5
        this.transferInfo.y = (windowHeight - this.defaultImgSize.height) * 0.5
        imgEl.style.transform =
        'translate3d('+this.transferInfo.x+'px , '+this.transferInfo.y+'px,0px) scale(1)'
        //计算最大缩放比
        this.maxScale = Math.max(
            Math.round(imgNaturalWidth / this.defaultImgSize.width),
            Math.round(imgNaturalHeight / this.defaultImgSize.height),
            3
        )
    }
    /**
     * 事件绑定
     */
    bindEventListener(){
        const {imgEl,windowEl}=this
        this.wheel=this.wheel.bind(this)
        this.dblclick=this.dblclick.bind(this)
        this.mousedown=this.mousedown.bind(this)

        windowEl.addEventListener('wheel', this.wheel, false)
        imgEl.addEventListener('dblclick',this.dblclick,false)
        imgEl.addEventListener('mousedown',this.mousedown,false)
        
    }
    /**
     * 
     * 解绑事件
     */
    destory(){
        const {imgEl,windowEl}=this
        windowEl.removeEventListener('WheelEvent', this.wheel, false)
        imgEl.removeEventListener('dbclick',this.dbclick,false)
        imgEl.removeEventListener('mousedown',this.mousedown,false)
        document.removeEventListener('mousemove',this.mousemove,false)
        document.removeEventListener('mouseup',this.mouseup,false)
    }

    /**
     * 
     * 鼠标滚轮实现放大缩小
     */
    wheel(event){
        if(event.wheelDelta>0){
            //向上滚动  放大
            this.zoom('out')
        }else{
            //缩小
            this.zoom('in')
        }
    }
    /**
     * 
     * 放大或缩小
     */

    zoom(type='out'){
        const {maxScale,minScale,step,windowWidth,windowHeight,defaultImgSize}=this
        // 计算滚轮滑动后的新scale
        let newScale=this.transferInfo.scale
        if(type==='out'){
            newScale+=step
            //放大
        }else{
            newScale-=step
        }
        newScale=newScale>maxScale?maxScale:newScale
        newScale=newScale<minScale?minScale:newScale

        //缩放比率
        const ratio=newScale/this.transferInfo.scale

         //原始x、y偏移量
        const initX = (windowWidth - defaultImgSize.width) * 0.5
        const initY = (windowHeight - defaultImgSize.height) * 0.5 

        const origin = {
            x: (ratio - 1) * defaultImgSize.width * 0.5,
            y: (ratio - 1) * defaultImgSize.height * 0.5,
        }
        const windowTop = windowHeight / 2
        const windowLeft = windowWidth / 2

        let x = this.transferInfo.x
        let y = this.transferInfo.y
        //缩放后的图片宽高
        const imgWidth = newScale * defaultImgSize.width
        const imgHeight = newScale * defaultImgSize.height

        //缩放后的图片宽大于视口宽
        if (imgWidth > windowWidth) {
            const diffWidth = (imgWidth - windowWidth) * 0.5
            if (x >= diffWidth + initX) {
                x = diffWidth + initX
            } else if (x <= -diffWidth + initX) {
                x = -diffWidth + initX
            } else {
              x -= (ratio - 1) * (windowLeft - x) - origin.x
            }
        } else {
            //图片宽度小于视口，x轴偏移量为初始偏移量
            x = initX
        }
        if (imgHeight > windowHeight) {
            const diffHeight = (imgHeight - windowHeight) * 0.5
            if (y >= diffHeight + initY) {
                y = diffHeight + initY
            } else if (y <= -diffHeight + initY) {
                y = -diffHeight + initY
            } else {
                y -= (ratio - 1) * (windowTop - y) - origin.y
            }
        } else {
            y = initY
        }
        this.transferInfo = {
            x,
            y,
            scale:newScale
        }
        this.transition = 'none'
        this.setImgPosition()
    }
    /**
     * 双击实现基于中心点放大和恢复
     */
    dblclick(event){
        event.preventDefault()
        event.stopPropagation()
        const {windowWidth,windowHeight,defaultImgSize}= this
        let scale=this.transferInfo.scale
        if(scale<=1){
            //放大
            scale=this.maxScale
        }else{
            //恢复
            scale=1
        }
        this.transferInfo={
            x:(windowWidth - defaultImgSize.width) * 0.5,
            y:(windowHeight - defaultImgSize.height) * 0.5,
            scale
        }
        this.transition = 'transform 300ms'
        this.setImgPosition()
    }
    /**
     * 鼠标按键落下
     */
    mousedown(event){
        event.preventDefault()
        this.lastPoint={
            x:event.clientX,
            y:event.clientY,
        }
        this.mousemove=this.mousemove.bind(this)
        this.mouseup=this.mouseup.bind(this)
        document.addEventListener('mousemove',this.mousemove,false)
        document.addEventListener('mouseup',this.mouseup,false)
    }
    /**
     * 鼠标移动
     */
    mousemove(event){
        event.preventDefault()
        const {windowWidth,windowHeight,defaultImgSize,transferInfo}=this
        const {width,height}=defaultImgSize
        const {scale}=transferInfo
        //缩放后图片实际宽高
        const imgHeight = height * scale
        const imgWidth = width * scale
        //当前鼠标位置
        const currentPointer={
            x:event.clientX,
            y:event.clientY,
        }
        //计算鼠标偏移量
        let _diffX = currentPointer.x - this.lastPoint.x
        let _diffY = currentPointer.y - this.lastPoint.y
        // 更新鼠标的位置
        this.lastPoint = { ...currentPointer }
        //缩放后图片与视口宽高差的一半
        const diffHeight = (imgHeight - windowHeight) * 0.5
        const diffWidth = (imgWidth - windowWidth) * 0.5
        //未缩放时初始视口与图片宽高差的一半
        const initX = (windowWidth - defaultImgSize.width) * 0.5
        const initY = (windowHeight - defaultImgSize.height) * 0.5
        
        // 拖拽时重新计算图片位置并进行边缘控制
        //图片宽大于视口宽时可左右拖拽，图片高大于视口高时可上下拖拽
        if(imgHeight>windowHeight){
            //向下拖拽
            if (_diffY > 0) {
                //判断是否拖拽到上边缘
                if (transferInfo.y >= diffHeight + initY) {
                    transferInfo.y = diffHeight + initY
                } else {
                    transferInfo.y += _diffY
                }
            }else {
                //向上拖拽
                //判断是否拖拽到下边缘
                if (transferInfo.y <= -diffHeight + initY) {
                    transferInfo.y = -diffHeight + initY
                } else {
                    transferInfo.y += _diffY
                }
            }
        }

        if (imgWidth > windowWidth) {
            if (_diffX > 0) {
                if (transferInfo.x >= diffWidth + initX) {
                    transferInfo.x = diffWidth + initX
                } else {
                    transferInfo.x += _diffX
                }
            } else {
                if (transferInfo.x <= -diffWidth + initX) {
                    transferInfo.x = -diffWidth + initX
                } else {
                    transferInfo.x += _diffX
                }
            }
        }
        this.transition='none'
        this.setImgPosition()
    }
    /**
     * 鼠标按键抬起
     */
    mouseup(){
        document.removeEventListener('mousemove',this.mousemove,false)
        document.removeEventListener('mouseup',this.mouseup,false)
    }
    setImgPosition(){
        const {imgEl,transferInfo}=this
        imgEl.style.transform =
        'translate3d(' +
        transferInfo.x +
        'px, ' +
        transferInfo.y +
        'px, 0px) scale(' +
        transferInfo.scale +
        ')'
        imgEl.style.transition=this.transition
    }
}