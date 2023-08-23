import './carousel.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import { register } from 'swiper/element/bundle'
import 'swiper/css';
import 'swiper/css/navigation'
import 'swiper/css/pagination'

register()

export default function Carousel() {
    return (
        <article>
            <Swiper
            pagination={true}
            autoplay>
                <SwiperSlide>
                    <img src={require('../../assets/imgs/slide-1.png')} alt="img1" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src={require('../../assets/imgs/slide-2.png')} alt="img1" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src={require('../../assets/imgs/slide-3.png')} alt="img1" />
                </SwiperSlide>
            </Swiper>
        </article>
    )
}