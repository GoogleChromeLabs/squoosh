pub trait Clamp: std::cmp::PartialOrd + Sized {
    fn clamp(self, min: Self, max: Self) -> Self {
        if self.lt(&min) {
            min
        } else if self.gt(&max) {
            max
        } else {
            self
        }
    }
}

impl Clamp for f32 {}

pub fn srgb_to_linear(v: f32) -> f32 {
    if v < 0.04045 {
        v / 12.92
    } else {
        ((v + 0.055) / 1.055).powf(2.4).clamp(0.0, 1.0)
    }
}

pub fn linear_to_srgb(v: f32) -> f32 {
    if v < 0.0031308 {
        v * 12.92
    } else {
        (1.055 * v.powf(1.0 / 2.4) - 0.055).clamp(0.0, 1.0)
    }
}
