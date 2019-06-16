use common::{
    diff, interp1, interp2, interp3, interp5, interp6, interp7, interp8, rgb_to_yuv, yuv_diff,
};

macro_rules! pixel00_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize] = $w[5];
    };
}
macro_rules! pixel00_11 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize] = interp1($w[5], $w[4]);
    };
}
macro_rules! pixel00_12 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize] = interp1($w[5], $w[2]);
    };
}
macro_rules! pixel00_20 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize] = interp2($w[5], $w[2], $w[4]);
    };
}
macro_rules! pixel00_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize] = interp5($w[2], $w[4]);
    };
}
macro_rules! pixel00_80 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize] = interp8($w[5], $w[1]);
    };
}
macro_rules! pixel00_81 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize] = interp8($w[5], $w[4]);
    };
}
macro_rules! pixel00_82 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize] = interp8($w[5], $w[2]);
    };
}
macro_rules! pixel01_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 1] = $w[5];
    };
}
macro_rules! pixel01_10 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 1] = interp1($w[5], $w[1]);
    };
}
macro_rules! pixel01_12 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 1] = interp1($w[5], $w[2]);
    };
}
macro_rules! pixel01_14 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 1] = interp1($w[2], $w[5]);
    };
}
macro_rules! pixel01_21 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 1] = interp2($w[2], $w[5], $w[4]);
    };
}
macro_rules! pixel01_31 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 1] = interp3($w[5], $w[4]);
    };
}
macro_rules! pixel01_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 1] = interp5($w[2], $w[5]);
    };
}
macro_rules! pixel01_60 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 1] = interp6($w[5], $w[2], $w[4]);
    };
}
macro_rules! pixel01_61 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 1] = interp6($w[5], $w[2], $w[1]);
    };
}
macro_rules! pixel01_82 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 1] = interp8($w[5], $w[2]);
    };
}
macro_rules! pixel01_83 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 1] = interp8($w[2], $w[4]);
    };
}
macro_rules! pixel02_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 2] = $w[5];
    };
}
macro_rules! pixel02_10 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 2] = interp1($w[5], $w[3]);
    };
}
macro_rules! pixel02_11 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 2] = interp1($w[5], $w[2]);
    };
}
macro_rules! pixel02_13 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 2] = interp1($w[2], $w[5]);
    };
}
macro_rules! pixel02_21 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 2] = interp2($w[2], $w[5], $w[6]);
    };
}
macro_rules! pixel02_32 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 2] = interp3($w[5], $w[6]);
    };
}
macro_rules! pixel02_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 2] = interp5($w[2], $w[5]);
    };
}
macro_rules! pixel02_60 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 2] = interp6($w[5], $w[2], $w[6]);
    };
}
macro_rules! pixel02_61 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 2] = interp6($w[5], $w[2], $w[3]);
    };
}
macro_rules! pixel02_81 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 2] = interp8($w[5], $w[2]);
    };
}
macro_rules! pixel02_83 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 2] = interp8($w[2], $w[6]);
    };
}
macro_rules! pixel03_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 3] = $w[5];
    };
}
macro_rules! pixel03_11 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 3] = interp1($w[5], $w[2]);
    };
}
macro_rules! pixel03_12 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 3] = interp1($w[5], $w[6]);
    };
}
macro_rules! pixel03_20 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 3] = interp2($w[5], $w[2], $w[6]);
    };
}
macro_rules! pixel03_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 3] = interp5($w[2], $w[6]);
    };
}
macro_rules! pixel03_80 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 3] = interp8($w[5], $w[3]);
    };
}
macro_rules! pixel03_81 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 3] = interp8($w[5], $w[2]);
    };
}
macro_rules! pixel03_82 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[$dst_index as usize + 3] = interp8($w[5], $w[6]);
    };
}
macro_rules! pixel10_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements) as usize] = $w[5];
    };
}
macro_rules! pixel10_10 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements) as usize] = interp1($w[5], $w[1]);
    };
}
macro_rules! pixel10_11 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements) as usize] = interp1($w[5], $w[4]);
    };
}
macro_rules! pixel10_13 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements) as usize] = interp1($w[4], $w[5]);
    };
}
macro_rules! pixel10_21 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements) as usize] = interp2($w[4], $w[5], $w[2]);
    };
}
macro_rules! pixel10_32 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements) as usize] = interp3($w[5], $w[2]);
    };
}
macro_rules! pixel10_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements) as usize] = interp5($w[4], $w[5]);
    };
}
macro_rules! pixel10_60 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements) as usize] = interp6($w[5], $w[4], $w[2]);
    };
}
macro_rules! pixel10_61 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements) as usize] = interp6($w[5], $w[4], $w[1]);
    };
}
macro_rules! pixel10_81 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements) as usize] = interp8($w[5], $w[4]);
    };
}
macro_rules! pixel10_83 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements) as usize] = interp8($w[4], $w[2]);
    };
}
macro_rules! pixel11_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 1) as usize] = $w[5];
    };
}
macro_rules! pixel11_30 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 1) as usize] = interp3($w[5], $w[1]);
    };
}
macro_rules! pixel11_31 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 1) as usize] = interp3($w[5], $w[4]);
    };
}
macro_rules! pixel11_32 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 1) as usize] = interp3($w[5], $w[2]);
    };
}
macro_rules! pixel11_70 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 1) as usize] = interp7($w[5], $w[4], $w[2]);
    };
}
macro_rules! pixel12_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 2) as usize] = $w[5];
    };
}
macro_rules! pixel12_30 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 2) as usize] = interp3($w[5], $w[3]);
    };
}
macro_rules! pixel12_31 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 2) as usize] = interp3($w[5], $w[2]);
    };
}
macro_rules! pixel12_32 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 2) as usize] = interp3($w[5], $w[6]);
    };
}
macro_rules! pixel12_70 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 2) as usize] = interp7($w[5], $w[6], $w[2]);
    };
}
macro_rules! pixel13_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 3) as usize] = $w[5];
    };
}
macro_rules! pixel13_10 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 3) as usize] = interp1($w[5], $w[3]);
    };
}
macro_rules! pixel13_12 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 3) as usize] = interp1($w[5], $w[6]);
    };
}
macro_rules! pixel13_14 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 3) as usize] = interp1($w[6], $w[5]);
    };
}
macro_rules! pixel13_21 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 3) as usize] = interp2($w[6], $w[5], $w[2]);
    };
}
macro_rules! pixel13_31 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 3) as usize] = interp3($w[5], $w[2]);
    };
}
macro_rules! pixel13_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 3) as usize] = interp5($w[6], $w[5]);
    };
}
macro_rules! pixel13_60 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 3) as usize] = interp6($w[5], $w[6], $w[2]);
    };
}
macro_rules! pixel13_61 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 3) as usize] = interp6($w[5], $w[6], $w[3]);
    };
}
macro_rules! pixel13_82 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 3) as usize] = interp8($w[5], $w[6]);
    };
}
macro_rules! pixel13_83 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements + 3) as usize] = interp8($w[6], $w[2]);
    };
}
macro_rules! pixel20_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2) as usize] = $w[5];
    };
}
macro_rules! pixel20_10 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2) as usize] = interp1($w[5], $w[7]);
    };
}
macro_rules! pixel20_12 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2) as usize] = interp1($w[5], $w[4]);
    };
}
macro_rules! pixel20_14 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2) as usize] = interp1($w[4], $w[5]);
    };
}
macro_rules! pixel20_21 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2) as usize] = interp2($w[4], $w[5], $w[8]);
    };
}
macro_rules! pixel20_31 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2) as usize] = interp3($w[5], $w[8]);
    };
}
macro_rules! pixel20_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2) as usize] = interp5($w[4], $w[5]);
    };
}
macro_rules! pixel20_60 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2) as usize] = interp6($w[5], $w[4], $w[8]);
    };
}
macro_rules! pixel20_61 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2) as usize] = interp6($w[5], $w[4], $w[7]);
    };
}
macro_rules! pixel20_82 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2) as usize] = interp8($w[5], $w[4]);
    };
}
macro_rules! pixel20_83 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2) as usize] = interp8($w[4], $w[8]);
    };
}
macro_rules! pixel21_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 1) as usize] = $w[5];
    };
}
macro_rules! pixel21_30 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 1) as usize] = interp3($w[5], $w[7]);
    };
}
macro_rules! pixel21_31 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 1) as usize] = interp3($w[5], $w[8]);
    };
}
macro_rules! pixel21_32 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 1) as usize] = interp3($w[5], $w[4]);
    };
}
macro_rules! pixel21_70 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 1) as usize] = interp7($w[5], $w[4], $w[8]);
    };
}
macro_rules! pixel22_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 2) as usize] = $w[5];
    };
}
macro_rules! pixel22_30 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 2) as usize] = interp3($w[5], $w[9]);
    };
}
macro_rules! pixel22_31 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 2) as usize] = interp3($w[5], $w[6]);
    };
}
macro_rules! pixel22_32 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 2) as usize] = interp3($w[5], $w[8]);
    };
}
macro_rules! pixel22_70 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 2) as usize] = interp7($w[5], $w[6], $w[8]);
    };
}
macro_rules! pixel23_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 3) as usize] = $w[5];
    };
}
macro_rules! pixel23_10 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 3) as usize] = interp1($w[5], $w[9]);
    };
}
macro_rules! pixel23_11 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 3) as usize] = interp1($w[5], $w[6]);
    };
}
macro_rules! pixel23_13 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 3) as usize] = interp1($w[6], $w[5]);
    };
}
macro_rules! pixel23_21 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 3) as usize] = interp2($w[6], $w[5], $w[8]);
    };
}
macro_rules! pixel23_32 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 3) as usize] = interp3($w[5], $w[8]);
    };
}
macro_rules! pixel23_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 3) as usize] = interp5($w[6], $w[5]);
    };
}
macro_rules! pixel23_60 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 3) as usize] = interp6($w[5], $w[6], $w[8]);
    };
}
macro_rules! pixel23_61 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 3) as usize] = interp6($w[5], $w[6], $w[9]);
    };
}
macro_rules! pixel23_81 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 3) as usize] = interp8($w[5], $w[6]);
    };
}
macro_rules! pixel23_83 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 2 + 3) as usize] = interp8($w[6], $w[8]);
    };
}
macro_rules! pixel30_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3) as usize] = $w[5];
    };
}
macro_rules! pixel30_11 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3) as usize] = interp1($w[5], $w[8]);
    };
}
macro_rules! pixel30_12 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3) as usize] = interp1($w[5], $w[4]);
    };
}
macro_rules! pixel30_20 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3) as usize] = interp2($w[5], $w[8], $w[4]);
    };
}
macro_rules! pixel30_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3) as usize] = interp5($w[8], $w[4]);
    };
}
macro_rules! pixel30_80 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3) as usize] = interp8($w[5], $w[7]);
    };
}
macro_rules! pixel30_81 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3) as usize] = interp8($w[5], $w[8]);
    };
}
macro_rules! pixel30_82 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3) as usize] = interp8($w[5], $w[4]);
    };
}
macro_rules! pixel31_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 1) as usize] = $w[5];
    };
}
macro_rules! pixel31_10 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 1) as usize] = interp1($w[5], $w[7]);
    };
}
macro_rules! pixel31_11 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 1) as usize] = interp1($w[5], $w[8]);
    };
}
macro_rules! pixel31_13 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 1) as usize] = interp1($w[8], $w[5]);
    };
}
macro_rules! pixel31_21 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 1) as usize] = interp2($w[8], $w[5], $w[4]);
    };
}
macro_rules! pixel31_32 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 1) as usize] = interp3($w[5], $w[4]);
    };
}
macro_rules! pixel31_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 1) as usize] = interp5($w[8], $w[5]);
    };
}
macro_rules! pixel31_60 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 1) as usize] = interp6($w[5], $w[8], $w[4]);
    };
}
macro_rules! pixel31_61 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 1) as usize] = interp6($w[5], $w[8], $w[7]);
    };
}
macro_rules! pixel31_81 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 1) as usize] = interp8($w[5], $w[8]);
    };
}
macro_rules! pixel31_83 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 1) as usize] = interp8($w[8], $w[4]);
    };
}
macro_rules! pixel32_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 2) as usize] = $w[5];
    };
}
macro_rules! pixel32_10 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 2) as usize] = interp1($w[5], $w[9]);
    };
}
macro_rules! pixel32_12 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 2) as usize] = interp1($w[5], $w[8]);
    };
}
macro_rules! pixel32_14 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 2) as usize] = interp1($w[8], $w[5]);
    };
}
macro_rules! pixel32_21 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 2) as usize] = interp2($w[8], $w[5], $w[6]);
    };
}
macro_rules! pixel32_31 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 2) as usize] = interp3($w[5], $w[6]);
    };
}
macro_rules! pixel32_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 2) as usize] = interp5($w[8], $w[5]);
    };
}
macro_rules! pixel32_60 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 2) as usize] = interp6($w[5], $w[8], $w[6]);
    };
}
macro_rules! pixel32_61 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 2) as usize] = interp6($w[5], $w[8], $w[9]);
    };
}
macro_rules! pixel32_82 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 2) as usize] = interp8($w[5], $w[8]);
    };
}
macro_rules! pixel32_83 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 2) as usize] = interp8($w[8], $w[6]);
    };
}
macro_rules! pixel33_0 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 3) as usize] = $w[5];
    };
}
macro_rules! pixel33_11 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 3) as usize] = interp1($w[5], $w[6]);
    };
}
macro_rules! pixel33_12 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 3) as usize] = interp1($w[5], $w[8]);
    };
}
macro_rules! pixel33_20 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 3) as usize] = interp2($w[5], $w[8], $w[6]);
    };
}
macro_rules! pixel33_50 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 3) as usize] = interp5($w[8], $w[6]);
    };
}
macro_rules! pixel33_80 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 3) as usize] = interp8($w[5], $w[9]);
    };
}
macro_rules! pixel33_81 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 3) as usize] = interp8($w[5], $w[6]);
    };
}
macro_rules! pixel33_82 {
    ($dst:ident, $dst_index:ident, $dst_row_elements:ident, $w:ident) => {
        $dst[($dst_index + $dst_row_elements * 3 + 3) as usize] = interp8($w[5], $w[8]);
    };
}

pub fn calculate(src: &[u32], dst: &mut [u32], width: usize, height: usize) {
    let row_bytes_l = width * 4;
    inner(src, row_bytes_l, dst, row_bytes_l * 4, width, height);
}

pub fn inner(
    src: &[u32],
    src_row_bytes: usize,
    dst: &mut [u32],
    dst_row_bytes: usize,
    width: usize,
    height: usize,
) {
    let mut w = [0; 10];
    let src_row_elements = (src_row_bytes >> 2) as isize;
    let dst_row_elements = (dst_row_bytes >> 2) as isize;
    let mut src_index = 0isize;
    let mut dst_index = 0isize;
    let mut src_row_offset = 0;
    let mut dst_row_offset = 0;

    for j in 0..height {
        let prev_line = if j > 0 { -src_row_elements } else { 0 };
        let next_line = if j < height - 1 { src_row_elements } else { 0 };

        for i in 0..width {
            w[2] = src[(src_index + prev_line) as usize];
            w[5] = src[src_index as usize];
            w[8] = src[(src_index + next_line) as usize];

            if i > 0 {
                w[1] = src[(src_index + prev_line - 1) as usize];
                w[4] = src[(src_index - 1) as usize];
                w[7] = src[(src_index + next_line - 1) as usize];
            } else {
                w[1] = w[2];
                w[4] = w[5];
                w[7] = w[8];
            }

            if i < width - 1 {
                w[3] = src[(src_index + prev_line + 1) as usize];
                w[6] = src[(src_index + 1) as usize];
                w[9] = src[(src_index + next_line + 1) as usize];
            } else {
                w[3] = w[2];
                w[6] = w[5];
                w[9] = w[8];
            }

            let (mut pattern, mut flag) = (0, 1);

            let yuv1 = rgb_to_yuv(w[5]);

            for k in 1..10 {
                if k == 5 {
                    continue;
                }

                if w[k] != w[5] {
                    let yuv2 = rgb_to_yuv(w[k]);
                    if yuv_diff(yuv1, yuv2) {
                        pattern |= flag;
                    }
                }
                flag <<= 1;
            }

            match pattern {
                0 | 1 | 4 | 32 | 128 | 5 | 132 | 160 | 33 | 129 | 36 | 133 | 164 | 161 | 37
                | 165 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                2 | 34 | 130 | 162 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                16 | 17 | 48 | 49 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                64 | 65 | 68 | 69 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                8 | 12 | 136 | 140 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                3 | 35 | 131 | 163 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                6 | 38 | 134 | 166 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                20 | 21 | 52 | 53 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                144 | 145 | 176 | 177 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                192 | 193 | 196 | 197 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                96 | 97 | 100 | 101 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                40 | 44 | 168 | 172 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                9 | 13 | 137 | 141 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                18 | 50 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                80 | 81 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                72 | 76 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                10 | 138 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                66 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                24 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                7 | 39 | 135 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                148 | 149 | 180 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                224 | 228 | 225 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                41 | 169 | 45 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                22 | 54 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                208 | 209 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                104 | 108 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                11 | 139 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                19 | 51 => {
                    if diff(w[2], w[6]) {
                        pixel00_81!(dst, dst_index, dst_row_elements, w);
                        pixel01_31!(dst, dst_index, dst_row_elements, w);
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_12!(dst, dst_index, dst_row_elements, w);
                        pixel01_14!(dst, dst_index, dst_row_elements, w);
                        pixel02_83!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel12_70!(dst, dst_index, dst_row_elements, w);
                        pixel13_21!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                146 | 178 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                        pixel23_32!(dst, dst_index, dst_row_elements, w);
                        pixel33_82!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_21!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel12_70!(dst, dst_index, dst_row_elements, w);
                        pixel13_83!(dst, dst_index, dst_row_elements, w);
                        pixel23_13!(dst, dst_index, dst_row_elements, w);
                        pixel33_11!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                }
                84 | 85 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel03_81!(dst, dst_index, dst_row_elements, w);
                        pixel13_31!(dst, dst_index, dst_row_elements, w);
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel03_12!(dst, dst_index, dst_row_elements, w);
                        pixel13_14!(dst, dst_index, dst_row_elements, w);
                        pixel22_70!(dst, dst_index, dst_row_elements, w);
                        pixel23_83!(dst, dst_index, dst_row_elements, w);
                        pixel32_21!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                112 | 113 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel30_82!(dst, dst_index, dst_row_elements, w);
                        pixel31_32!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_70!(dst, dst_index, dst_row_elements, w);
                        pixel23_21!(dst, dst_index, dst_row_elements, w);
                        pixel30_11!(dst, dst_index, dst_row_elements, w);
                        pixel31_13!(dst, dst_index, dst_row_elements, w);
                        pixel32_83!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                }
                200 | 204 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_31!(dst, dst_index, dst_row_elements, w);
                        pixel33_81!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_21!(dst, dst_index, dst_row_elements, w);
                        pixel21_70!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_83!(dst, dst_index, dst_row_elements, w);
                        pixel32_14!(dst, dst_index, dst_row_elements, w);
                        pixel33_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                }
                73 | 77 => {
                    if diff(w[8], w[4]) {
                        pixel00_82!(dst, dst_index, dst_row_elements, w);
                        pixel10_32!(dst, dst_index, dst_row_elements, w);
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_11!(dst, dst_index, dst_row_elements, w);
                        pixel10_13!(dst, dst_index, dst_row_elements, w);
                        pixel20_83!(dst, dst_index, dst_row_elements, w);
                        pixel21_70!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_21!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                42 | 170 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                        pixel20_31!(dst, dst_index, dst_row_elements, w);
                        pixel30_81!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_21!(dst, dst_index, dst_row_elements, w);
                        pixel10_83!(dst, dst_index, dst_row_elements, w);
                        pixel11_70!(dst, dst_index, dst_row_elements, w);
                        pixel20_14!(dst, dst_index, dst_row_elements, w);
                        pixel30_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                14 | 142 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel02_32!(dst, dst_index, dst_row_elements, w);
                        pixel03_82!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_83!(dst, dst_index, dst_row_elements, w);
                        pixel02_13!(dst, dst_index, dst_row_elements, w);
                        pixel03_11!(dst, dst_index, dst_row_elements, w);
                        pixel10_21!(dst, dst_index, dst_row_elements, w);
                        pixel11_70!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                67 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                70 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                28 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                152 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                194 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                98 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                56 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                25 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                26 | 31 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                82 | 214 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                88 | 248 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                }
                74 | 107 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                27 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                86 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                216 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                106 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                30 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                210 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                120 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                75 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                29 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                198 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                184 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                99 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                57 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                71 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                156 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                226 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                60 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                195 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                102 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                153 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                58 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                83 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                92 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                202 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                78 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                154 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                114 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                }
                89 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                90 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                55 | 23 => {
                    if diff(w[2], w[6]) {
                        pixel00_81!(dst, dst_index, dst_row_elements, w);
                        pixel01_31!(dst, dst_index, dst_row_elements, w);
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_12!(dst, dst_index, dst_row_elements, w);
                        pixel01_14!(dst, dst_index, dst_row_elements, w);
                        pixel02_83!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel12_70!(dst, dst_index, dst_row_elements, w);
                        pixel13_21!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                182 | 150 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_32!(dst, dst_index, dst_row_elements, w);
                        pixel33_82!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_21!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel12_70!(dst, dst_index, dst_row_elements, w);
                        pixel13_83!(dst, dst_index, dst_row_elements, w);
                        pixel23_13!(dst, dst_index, dst_row_elements, w);
                        pixel33_11!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                }
                213 | 212 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel03_81!(dst, dst_index, dst_row_elements, w);
                        pixel13_31!(dst, dst_index, dst_row_elements, w);
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel03_12!(dst, dst_index, dst_row_elements, w);
                        pixel13_14!(dst, dst_index, dst_row_elements, w);
                        pixel22_70!(dst, dst_index, dst_row_elements, w);
                        pixel23_83!(dst, dst_index, dst_row_elements, w);
                        pixel32_21!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                241 | 240 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_82!(dst, dst_index, dst_row_elements, w);
                        pixel31_32!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_70!(dst, dst_index, dst_row_elements, w);
                        pixel23_21!(dst, dst_index, dst_row_elements, w);
                        pixel30_11!(dst, dst_index, dst_row_elements, w);
                        pixel31_13!(dst, dst_index, dst_row_elements, w);
                        pixel32_83!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                }
                236 | 232 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_31!(dst, dst_index, dst_row_elements, w);
                        pixel33_81!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_21!(dst, dst_index, dst_row_elements, w);
                        pixel21_70!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_83!(dst, dst_index, dst_row_elements, w);
                        pixel32_14!(dst, dst_index, dst_row_elements, w);
                        pixel33_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                }
                109 | 105 => {
                    if diff(w[8], w[4]) {
                        pixel00_82!(dst, dst_index, dst_row_elements, w);
                        pixel10_32!(dst, dst_index, dst_row_elements, w);
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_11!(dst, dst_index, dst_row_elements, w);
                        pixel10_13!(dst, dst_index, dst_row_elements, w);
                        pixel20_83!(dst, dst_index, dst_row_elements, w);
                        pixel21_70!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_21!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                171 | 43 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                        pixel20_31!(dst, dst_index, dst_row_elements, w);
                        pixel30_81!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_21!(dst, dst_index, dst_row_elements, w);
                        pixel10_83!(dst, dst_index, dst_row_elements, w);
                        pixel11_70!(dst, dst_index, dst_row_elements, w);
                        pixel20_14!(dst, dst_index, dst_row_elements, w);
                        pixel30_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                143 | 15 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel02_32!(dst, dst_index, dst_row_elements, w);
                        pixel03_82!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_83!(dst, dst_index, dst_row_elements, w);
                        pixel02_13!(dst, dst_index, dst_row_elements, w);
                        pixel03_11!(dst, dst_index, dst_row_elements, w);
                        pixel10_21!(dst, dst_index, dst_row_elements, w);
                        pixel11_70!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                124 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                203 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                62 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                211 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                118 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                217 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                110 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                155 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                188 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                185 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                61 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                157 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                103 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                227 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                230 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                199 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                220 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                }
                158 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                234 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                242 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                }
                59 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                121 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                87 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                79 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                122 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                94 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                218 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                }
                91 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                229 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                167 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                173 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                181 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                186 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                115 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                }
                93 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                206 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                205 | 201 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_10!(dst, dst_index, dst_row_elements, w);
                        pixel21_30!(dst, dst_index, dst_row_elements, w);
                        pixel30_80!(dst, dst_index, dst_row_elements, w);
                        pixel31_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_12!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                        pixel31_11!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                174 | 46 => {
                    if diff(w[4], w[2]) {
                        pixel00_80!(dst, dst_index, dst_row_elements, w);
                        pixel01_10!(dst, dst_index, dst_row_elements, w);
                        pixel10_10!(dst, dst_index, dst_row_elements, w);
                        pixel11_30!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                        pixel01_12!(dst, dst_index, dst_row_elements, w);
                        pixel10_11!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                179 | 147 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_10!(dst, dst_index, dst_row_elements, w);
                        pixel03_80!(dst, dst_index, dst_row_elements, w);
                        pixel12_30!(dst, dst_index, dst_row_elements, w);
                        pixel13_10!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_11!(dst, dst_index, dst_row_elements, w);
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                117 | 116 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel22_30!(dst, dst_index, dst_row_elements, w);
                        pixel23_10!(dst, dst_index, dst_row_elements, w);
                        pixel32_10!(dst, dst_index, dst_row_elements, w);
                        pixel33_80!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_11!(dst, dst_index, dst_row_elements, w);
                        pixel32_12!(dst, dst_index, dst_row_elements, w);
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                }
                189 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                231 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                126 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                219 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                125 => {
                    if diff(w[8], w[4]) {
                        pixel00_82!(dst, dst_index, dst_row_elements, w);
                        pixel10_32!(dst, dst_index, dst_row_elements, w);
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_11!(dst, dst_index, dst_row_elements, w);
                        pixel10_13!(dst, dst_index, dst_row_elements, w);
                        pixel20_83!(dst, dst_index, dst_row_elements, w);
                        pixel21_70!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_21!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                221 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel03_81!(dst, dst_index, dst_row_elements, w);
                        pixel13_31!(dst, dst_index, dst_row_elements, w);
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel03_12!(dst, dst_index, dst_row_elements, w);
                        pixel13_14!(dst, dst_index, dst_row_elements, w);
                        pixel22_70!(dst, dst_index, dst_row_elements, w);
                        pixel23_83!(dst, dst_index, dst_row_elements, w);
                        pixel32_21!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                207 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel02_32!(dst, dst_index, dst_row_elements, w);
                        pixel03_82!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_83!(dst, dst_index, dst_row_elements, w);
                        pixel02_13!(dst, dst_index, dst_row_elements, w);
                        pixel03_11!(dst, dst_index, dst_row_elements, w);
                        pixel10_21!(dst, dst_index, dst_row_elements, w);
                        pixel11_70!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                238 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel21_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_31!(dst, dst_index, dst_row_elements, w);
                        pixel33_81!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_21!(dst, dst_index, dst_row_elements, w);
                        pixel21_70!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_83!(dst, dst_index, dst_row_elements, w);
                        pixel32_14!(dst, dst_index, dst_row_elements, w);
                        pixel33_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                }
                190 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_32!(dst, dst_index, dst_row_elements, w);
                        pixel33_82!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_21!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel12_70!(dst, dst_index, dst_row_elements, w);
                        pixel13_83!(dst, dst_index, dst_row_elements, w);
                        pixel23_13!(dst, dst_index, dst_row_elements, w);
                        pixel33_11!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                }
                187 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                        pixel11_0!(dst, dst_index, dst_row_elements, w);
                        pixel20_31!(dst, dst_index, dst_row_elements, w);
                        pixel30_81!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_21!(dst, dst_index, dst_row_elements, w);
                        pixel10_83!(dst, dst_index, dst_row_elements, w);
                        pixel11_70!(dst, dst_index, dst_row_elements, w);
                        pixel20_14!(dst, dst_index, dst_row_elements, w);
                        pixel30_12!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                243 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel22_0!(dst, dst_index, dst_row_elements, w);
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_82!(dst, dst_index, dst_row_elements, w);
                        pixel31_32!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel22_70!(dst, dst_index, dst_row_elements, w);
                        pixel23_21!(dst, dst_index, dst_row_elements, w);
                        pixel30_11!(dst, dst_index, dst_row_elements, w);
                        pixel31_13!(dst, dst_index, dst_row_elements, w);
                        pixel32_83!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                }
                119 => {
                    if diff(w[2], w[6]) {
                        pixel00_81!(dst, dst_index, dst_row_elements, w);
                        pixel01_31!(dst, dst_index, dst_row_elements, w);
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel12_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_12!(dst, dst_index, dst_row_elements, w);
                        pixel01_14!(dst, dst_index, dst_row_elements, w);
                        pixel02_83!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel12_70!(dst, dst_index, dst_row_elements, w);
                        pixel13_21!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                237 | 233 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_60!(dst, dst_index, dst_row_elements, w);
                    pixel03_20!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_70!(dst, dst_index, dst_row_elements, w);
                    pixel13_60!(dst, dst_index, dst_row_elements, w);
                    pixel20_0!(dst, dst_index, dst_row_elements, w);
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel31_0!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                175 | 47 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel01_0!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_0!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_70!(dst, dst_index, dst_row_elements, w);
                    pixel23_60!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_60!(dst, dst_index, dst_row_elements, w);
                    pixel33_20!(dst, dst_index, dst_row_elements, w);
                }
                183 | 151 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel13_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_60!(dst, dst_index, dst_row_elements, w);
                    pixel21_70!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_20!(dst, dst_index, dst_row_elements, w);
                    pixel31_60!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                245 | 244 => {
                    pixel00_20!(dst, dst_index, dst_row_elements, w);
                    pixel01_60!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_60!(dst, dst_index, dst_row_elements, w);
                    pixel11_70!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    pixel23_0!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                250 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                }
                123 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                95 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                222 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                252 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_61!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    pixel23_0!(dst, dst_index, dst_row_elements, w);
                    pixel32_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                249 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_61!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_0!(dst, dst_index, dst_row_elements, w);
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[8], w[4]) {
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel31_0!(dst, dst_index, dst_row_elements, w);
                }
                235 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_61!(dst, dst_index, dst_row_elements, w);
                    pixel20_0!(dst, dst_index, dst_row_elements, w);
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel31_0!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                111 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel01_0!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_0!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                63 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel01_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_0!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_61!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                159 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel13_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_61!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                215 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel13_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_61!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                246 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_61!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    pixel23_0!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                254 => {
                    pixel00_80!(dst, dst_index, dst_row_elements, w);
                    pixel01_10!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_10!(dst, dst_index, dst_row_elements, w);
                    pixel11_30!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    pixel23_0!(dst, dst_index, dst_row_elements, w);
                    pixel32_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                253 => {
                    pixel00_82!(dst, dst_index, dst_row_elements, w);
                    pixel01_82!(dst, dst_index, dst_row_elements, w);
                    pixel02_81!(dst, dst_index, dst_row_elements, w);
                    pixel03_81!(dst, dst_index, dst_row_elements, w);
                    pixel10_32!(dst, dst_index, dst_row_elements, w);
                    pixel11_32!(dst, dst_index, dst_row_elements, w);
                    pixel12_31!(dst, dst_index, dst_row_elements, w);
                    pixel13_31!(dst, dst_index, dst_row_elements, w);
                    pixel20_0!(dst, dst_index, dst_row_elements, w);
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    pixel23_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel31_0!(dst, dst_index, dst_row_elements, w);
                    pixel32_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                251 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_10!(dst, dst_index, dst_row_elements, w);
                    pixel03_80!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_30!(dst, dst_index, dst_row_elements, w);
                    pixel13_10!(dst, dst_index, dst_row_elements, w);
                    pixel20_0!(dst, dst_index, dst_row_elements, w);
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    if diff(w[8], w[4]) {
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel31_0!(dst, dst_index, dst_row_elements, w);
                }
                239 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel01_0!(dst, dst_index, dst_row_elements, w);
                    pixel02_32!(dst, dst_index, dst_row_elements, w);
                    pixel03_82!(dst, dst_index, dst_row_elements, w);
                    pixel10_0!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_32!(dst, dst_index, dst_row_elements, w);
                    pixel13_82!(dst, dst_index, dst_row_elements, w);
                    pixel20_0!(dst, dst_index, dst_row_elements, w);
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_31!(dst, dst_index, dst_row_elements, w);
                    pixel23_81!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel31_0!(dst, dst_index, dst_row_elements, w);
                    pixel32_31!(dst, dst_index, dst_row_elements, w);
                    pixel33_81!(dst, dst_index, dst_row_elements, w);
                }
                127 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel01_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel02_0!(dst, dst_index, dst_row_elements, w);
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                        pixel13_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel02_50!(dst, dst_index, dst_row_elements, w);
                        pixel03_50!(dst, dst_index, dst_row_elements, w);
                        pixel13_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_0!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel20_0!(dst, dst_index, dst_row_elements, w);
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                        pixel31_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel20_50!(dst, dst_index, dst_row_elements, w);
                        pixel30_50!(dst, dst_index, dst_row_elements, w);
                        pixel31_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_30!(dst, dst_index, dst_row_elements, w);
                    pixel23_10!(dst, dst_index, dst_row_elements, w);
                    pixel32_10!(dst, dst_index, dst_row_elements, w);
                    pixel33_80!(dst, dst_index, dst_row_elements, w);
                }
                191 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel01_0!(dst, dst_index, dst_row_elements, w);
                    pixel02_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_0!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel13_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_31!(dst, dst_index, dst_row_elements, w);
                    pixel21_31!(dst, dst_index, dst_row_elements, w);
                    pixel22_32!(dst, dst_index, dst_row_elements, w);
                    pixel23_32!(dst, dst_index, dst_row_elements, w);
                    pixel30_81!(dst, dst_index, dst_row_elements, w);
                    pixel31_81!(dst, dst_index, dst_row_elements, w);
                    pixel32_82!(dst, dst_index, dst_row_elements, w);
                    pixel33_82!(dst, dst_index, dst_row_elements, w);
                }
                223 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                        pixel01_0!(dst, dst_index, dst_row_elements, w);
                        pixel10_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_50!(dst, dst_index, dst_row_elements, w);
                        pixel01_50!(dst, dst_index, dst_row_elements, w);
                        pixel10_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel02_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel13_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_10!(dst, dst_index, dst_row_elements, w);
                    pixel21_30!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel23_0!(dst, dst_index, dst_row_elements, w);
                        pixel32_0!(dst, dst_index, dst_row_elements, w);
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel23_50!(dst, dst_index, dst_row_elements, w);
                        pixel32_50!(dst, dst_index, dst_row_elements, w);
                        pixel33_50!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel30_80!(dst, dst_index, dst_row_elements, w);
                    pixel31_10!(dst, dst_index, dst_row_elements, w);
                }
                247 => {
                    pixel00_81!(dst, dst_index, dst_row_elements, w);
                    pixel01_31!(dst, dst_index, dst_row_elements, w);
                    pixel02_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_81!(dst, dst_index, dst_row_elements, w);
                    pixel11_31!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel13_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_82!(dst, dst_index, dst_row_elements, w);
                    pixel21_32!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    pixel23_0!(dst, dst_index, dst_row_elements, w);
                    pixel30_82!(dst, dst_index, dst_row_elements, w);
                    pixel31_32!(dst, dst_index, dst_row_elements, w);
                    pixel32_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                255 => {
                    if diff(w[4], w[2]) {
                        pixel00_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel00_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel01_0!(dst, dst_index, dst_row_elements, w);
                    pixel02_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[2], w[6]) {
                        pixel03_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel03_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel10_0!(dst, dst_index, dst_row_elements, w);
                    pixel11_0!(dst, dst_index, dst_row_elements, w);
                    pixel12_0!(dst, dst_index, dst_row_elements, w);
                    pixel13_0!(dst, dst_index, dst_row_elements, w);
                    pixel20_0!(dst, dst_index, dst_row_elements, w);
                    pixel21_0!(dst, dst_index, dst_row_elements, w);
                    pixel22_0!(dst, dst_index, dst_row_elements, w);
                    pixel23_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[8], w[4]) {
                        pixel30_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel30_20!(dst, dst_index, dst_row_elements, w);
                    }
                    pixel31_0!(dst, dst_index, dst_row_elements, w);
                    pixel32_0!(dst, dst_index, dst_row_elements, w);
                    if diff(w[6], w[8]) {
                        pixel33_0!(dst, dst_index, dst_row_elements, w);
                    } else {
                        pixel33_20!(dst, dst_index, dst_row_elements, w);
                    }
                }
                _ => {}
            }
            src_index += 1;
            dst_index += 4;
        }

        src_row_offset += src_row_elements;
        src_index = src_row_offset;

        dst_row_offset += 4 * dst_row_elements;
        dst_index = dst_row_offset;
    }
}
