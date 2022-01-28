use std::fmt;
use rand::Rng;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
/// This enumeration represents the status of a cell.
pub enum Cell {
    Empty = 0,
    Alive = 1,
    Dead = 2
}

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
/// This enumeration represents the density to use when populating the universe randomly.
pub enum Density {
    Low = 20,
    Medium = 35,
    High = 50
}

#[wasm_bindgen]
/// This struct represents the universe.
pub struct Universe {
    width: u32,
    height: u32,
    cells: Vec<Cell>,
    circular: bool
}

#[wasm_bindgen]
impl Universe {
    /// Returns a new Universe.
    ///
    /// # Arguments
    /// * `width` - Universe's width
    /// * `height` - Universe's height
    pub fn new(width: u32, height: u32) -> Self {
        let count: usize = (width * height) as usize;
        let cells = (0..count).map(|_| Cell::Empty).collect();
        let circular = true;
        Universe { width, height, cells, circular }
    }

    /// Returs the Universe's width.
    pub fn width(&self) -> u32 {
        self.width
    }

    /// Returns the Universe's height.
    pub fn height(&self) -> u32 {
        self.height
    }

    /// Returns if the Universe is circular.
    pub fn is_circular(&self) -> bool {
        self.circular
    }

    /// Sets if the Universe is circular.
    pub fn set_circular(&mut self, circular: bool) {
        self.circular = circular;
    }

    /// A private method that calculates the cell position on the buffer vector.
    ///
    /// # Arguments
    /// * `x` - X position
    /// * `y` - Y position
    fn index(&self, x: u32, y: u32) -> usize {
        (x + y * self.width) as usize
    }

    /// Returns the cell at a coordinates.
    ///
    /// # Arguments
    /// * `x` - X position
    /// * `y` - Y position
    pub fn get(&self, x: u32, y: u32) -> Cell {
        self.cells[self.index(x, y)]
    }

    /// Sets the cell at a coordiantes.
    ///
    /// # Arguments
    /// * `x` - X position
    /// * `y` - Y position
    /// * `cell` - Cell status
    pub fn set(&mut self, x: u32, y: u32, cell: Cell) {
        let index = self.index(x, y);
        self.cells[index] = cell;
    }

    /// Toggles a cell between Alive and Empty.
    ///
    /// # Arguments
    /// * `x` - X position
    /// * `y` - Y position
    pub fn toggle(&mut self, x: u32, y: u32) {
        let index = self.index(x, y);
        let cell = if self.cells[index] == Cell::Alive { Cell::Empty } else { Cell::Alive };
        self.cells[index] = cell;
    }

    /// Randomly populates the universe.
    ///
    /// # Arguments
    /// * `density` - Density
    pub fn random(&mut self, density: Density) {
        let mut rng = rand::thread_rng();
        for x in self.cells.iter_mut() {
            let r: u8 = rng.gen_range(0..100);
            *x = if r < density as u8 { Cell::Alive } else { Cell::Empty };
        }
    }

    /// Sets all the cells in the universe.
    ///
    /// # Arguments
    /// * `cell` - Cell status to set in all positions.
    pub fn fill(&mut self, cell: Cell) {
        for x in self.cells.iter_mut() { *x = cell };
    }

    /// A private method that counts the live neighbors of a position.
    ///
    /// # Arguments
    /// * `x` - X position
    /// * `y` - Y position
    fn live_neighbor_count(&self, x: u32, y: u32) -> usize {
        let x: isize = x as isize;
        let y: isize = y as isize;
        let w = self.width() as isize;
        let h = self.height() as isize;
        let mut count = 0;
        for row in [-1, 0, 1].iter() {
            for col in [-1, 0, 1].iter() {
                if *row == 0 && *col == 0 { continue; }
                let mut nx = x + row;
                let mut ny = y + col;
                if nx < 0 { if self.circular { nx = w - 1; } else { continue; }}
                if nx >= w { if self.circular { nx = 0; } else { continue; }}
                if ny < 0 { if self.circular { ny = h - 1; } else { continue; }}
                if ny >= h { if self.circular { ny = 0; } else { continue; }}
                let index = self.index(nx as u32, ny as u32);
                count += if self.cells[index] == Cell::Alive { 1 } else { 0 };
            }
        }
        count
    }

    /// Calculates the next generation.
    pub fn next(&mut self) {
        let mut buffer:Vec<Cell> = Vec::with_capacity((self.width * self.height) as usize);
        for y in 0..self.height {
            for x in 0..self.width {
                let index = self.index(x, y);
                let cell = self.cells[index];
                let count = self.live_neighbor_count(x, y);
                let next = match (cell, count) {
                    (Cell::Alive, n) if n < 2           => Cell::Dead,
                    (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                    (Cell::Alive, x) if x > 3           => Cell::Dead,
                    (Cell::Dead, 3) | (Cell::Empty, 3)  => Cell::Alive,
                    (otherwise, _)                      => otherwise
                };
                buffer.push(next);
            }
        }
        self.cells = buffer;
    }
}

impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for line in self.cells.as_slice().chunks(self.width as usize) {
            for &cell in line {
                let c = match cell {
                    Cell::Empty => ' ',
                    Cell::Alive => '◼',
                    Cell::Dead  => '◻'
                };
                write!(f, "{}", c)?;
            }
            write!(f, "\n")?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic() {
        let mut u = Universe::new(60, 40);
        assert_eq!(60, u.width());
        assert_eq!(40, u.height());
        assert_eq!(Cell::Empty, u.get(6, 4));

        u.set(6, 4, Cell::Alive);
        assert_eq!(Cell::Alive, u.get(6, 4));

        u.toggle(6, 4);
        assert_eq!(Cell::Empty, u.get(6, 4));
        u.toggle(6, 4);
        assert_eq!(Cell::Alive, u.get(6, 4));

        assert_eq!(20u8, Density::Low as u8);
        u.random(Density::Medium);
    }

    #[test]
    fn test_next() {
        let map = vec![(5, 4), (5, 5), (5, 6), (4, 5), (6, 5)];
        let mut u = Universe::new(30, 11);
        u.fill(Cell::Dead);
        for (x, y) in map.iter() { u.toggle(*x as u32, *y as u32); }
        println!("{}", &u);

        let mut exp1:Option<String> = None;
        let mut exp2:Option<String> = None;
        for i in 0..12 {
            u.next();
            println!("{}.", i);
            println!("{}", &u);

            if i == 5 {
                exp1 = Some(u.to_string());
            } else if i == 6 {
                exp2 = Some(u.to_string());
            } else if i >= 7 {
                if i % 2 == 0 {
                    assert_eq!(exp2, Some(u.to_string()));
                } else {
                    assert_eq!(exp1, Some(u.to_string()));
                }
            }
        }
    }

    #[test]
    fn test_circular() {
        let map = vec![(0,5),(0,0),(0,1)];
        let mut u = Universe::new(10,6);
        u.fill(Cell::Dead);
        for (x, y) in map.iter() { u.toggle(*x as u32, *y as u32); }
        println!("{}", &u);

        let mut exp1:Option<String> = None;
        let mut exp2:Option<String> = None;
        for i in 0..5 {
            u.next();
            println!("{}.", i);
            println!("{}", &u);

            match i {
                0 => exp1 = Some(u.to_string()),
                1 => exp2 = Some(u.to_string()),
                _ => {
                    if i % 2 == 0 {
                        assert_eq!(exp1, Some(u.to_string()));
                    } else {
                        assert_eq!(exp2, Some(u.to_string()));
                    }
                }
            }
        }
    }

    #[test]
    fn test_no_circular() {
        let map = vec![(0,4),(0,0),(0,1)];
        let mut u = Universe::new(9,5);
        u.set_circular(false);
        u.fill(Cell::Dead);
        for (x, y) in map.iter() { u.toggle(*x as u32, *y as u32); }
        println!("{}", &u);

        u.next();
        println!("{}", &u);
        for x in 0..u.width() {
            for y in 0..u.height() {
                assert_eq!(Cell::Dead, u.get(x, y));
            }
        }

        let map = vec![(4,1),(4,2),(4,3)];
        for (x, y) in map.iter() { u.toggle(*x as u32, *y as u32); }
        println!("{}", &u);

        let mut exp1:Option<String> = None;
        let mut exp2:Option<String> = None;
        for i in 0..5 {
            u.next();
            println!("{}.", i);
            println!("{}", &u);

            match i {
                0 => exp1 = Some(u.to_string()),
                1 => exp2 = Some(u.to_string()),
                _ => {
                    if i % 2 == 0 {
                        assert_eq!(exp1, Some(u.to_string()));
                    } else {
                        assert_eq!(exp2, Some(u.to_string()));
                    }
                }
            }
         }
    }
}
