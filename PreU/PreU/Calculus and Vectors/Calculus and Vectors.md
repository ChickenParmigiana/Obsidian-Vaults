# Calculus and Vectors
## 1. Rates of Change
##### [[1.1 Reviewing Prerequisite Skills Questions]]
---

# Expanding Polynomials
## Multiply out polynomials. Simple Shit.
 
$$(x+3)(x-4)$$
$$=(x^2-4x+3x-12)$$
$$=x^2-x-12$$

* Multiply out, place terms in any order, simplify

$$(2x-1)(3x+5)$$
In this problem, the bracket on the left side of the - is 2x multiplied to each 3x and 5.

$$=(6x^2+10x)-(3x-5)$$
$$(6x^2+10-3x-5)$$
$$=6x^2+7x-5$$

This is pretty simple.


# Linear Functions
## Linear functions are polynomials with a degree of 1. They form straight lines.

The slope/intercept form of a linear function is y\=mx+by\=mx+b, where m is the slope and b is the y-intercept.

To determine the equation of a line given the slope and a point on the line use the formula $$y=m(x−x_1)+y_1$$ $$y=m(x-x_1)+y_1$$ where m is the slope and (x1,y1)(x1,y1) is the point on the line.

The slope of a straight line going through $A(x_1,y_1)$ and $B(x2,y2)$    
is $m=\frac{y2−y1}{x2−x1}$.

When the slope of a line is positive, we say the line is increasing, which means it goes up from left to right.

When the slope of a line is negative, we say the line is decreasing, which means it goes down from left to right.

A horizontal line has a slope of 0.

The slope of a vertical line is undefined. To understand this better, let’s consider riding a bike. Riding the bike on a flat road there is no slope. When riding the bike up a hill the steepness of the hill is the slope. Now consider a vertical wall. It is impossible to ride the bike straight up the wall. Therefore, the slope is said to be undefined.

# Quadratic Functions
## Quadratic functions are polynomials with ($x^2$). They form parabolas that open upwards or downwards.

* Negative Polynomial = 'U' Shape
* Positive Polynomial = '$\cap$' Shape

$$-x^2+x-12$$
or
$$x^2-x+12$$

### Factoring

Factoring can be used to find the roots (also known as the  $x−intercepts$) of a function.

These are the five most usual types of factoring:

* Common Factoring
* Factor by Inspection
* Factor by Decomposition
* Difference of Squares
* Perfect Squares

#### Common Factoring
An example of this is $$16x^2y^3+24x^5y+64x^6y^5+8x^2y$$
The common factor here is $8x^2y$

$$8x2y(2y^2+3x^3+8x^4y^4+1)$$

#### Factor by Inspection
In the example $x^2+5x+6$, find two numbers that multiple to 6 AND add to 5.
In this case, it is easy. The numbers are $+2$ and $+3$.
$$x^2+5x+6$$
$$=(x+2)(x+3)$$

#### Factor by Decomposition
In the example $2x^2+7x-15$, just like through inspection, we will find two numbers that multiply to $-30, (2$ x $15)$ and that add to 7.

Again, in this case it is easy, the numbers are $-3$ and $+10$.

$$2x^2+7x-15$$
$$=2x^2-3x+10x-15$$

Since we have $2x^2$, we know that $10x$ will not appear as the number 10 when factored, but 5. 

We can use decomposition to determine this with certainty. 

$$2x^2+7x-15$$
$$=2x^2-3x+10x-15$$
$$=x(2x-3)+5(2x-3)$$
$$=(2x-3)(x+5)$$

Remember, the format must be 
$$(x-n)(x+n)$$
Or something like that. No exponents or anything, that is why x is taken out during step 3 of the previous 4 step answer.

#### Difference of Squares
Sometimes, the integer numbers are perfect squares. 
That's great. 

$$16x^2-25y^2$$
The square roots are $4x$ and $5y$, respectively.
So, 
$$16x^2-25y^2$$
$$=(4x+5y)(4x-5y)$$
This pattern is universal. When there are two perfect squares in this formation, $16x^2-25y^2$, the factored answer will always be the two sets of $(4x+5y)$, but with a difference of signs.
They will both be positive if the original polynomial is positive, $16x^2+25y^2$.

#### Perfect Squares
Example:
$$144x^2+312x+169$$
The square root of $144x^2$ is $12x$.
The square root of 169 is 13.

2 x $12x$ x 13 = $312x$

$$144x^2+312x+169$$
$$(12x+13)^2$$


Just like life, nothing is perfect.

Don't bother learning this strategy, the amount of times it will apply is not enough to justify the time savings from just implementing the Difference of Squares method.

### Quadratic Formula
 * For when you can't be bothered to remember all those other rules and just need the roots. It even works when factoring is not possible or complicated or you have been factoring all night already. 

The quadratic formula can be used to determine the roots of a quadratic equation in the form of $$y=ax^2+bx+c$$

The quadratic formula is 
$$x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$$

Example: Find roots of 


Roots are when where the parabola intercepts the x axis, when y=0

$$y=4x^2-4x-8$$
$$a=4$$
$$b=-4$$
$$c=-8$$
---
$$x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$$
$$x=\frac{-(-4)\pm\sqrt{(-4)^2-4(4)(-8)}}{2(4)}$$
$$x=\frac{4\pm\sqrt{16+128}}{8}$$
$$x=\frac{4\pm\sqrt{144}}{8}$$

After calculating with numbers plugged in, we have this:
$$x=\frac{4\pm12}{8}$$

$\frac{16}{8} = 2$
and
$\frac{-8}{8} = -1$

So, the roots of $y=4x^2-4x-8$ are $2$ and $-1$.

## The Factor Theorem
The Factor Theorem is used to find the roots of polynomial functions with a degree of three or higher, such as cubic and quartic functions -Starting with $(x^3)$ or $(x^4)$.

Example: Find the roots of the function
$$y=x^3-7x-6$$
Factors will give a remainder of 0.

When $x=1$,

$y=(1)^3-7(1)-6=-12$

So, $(x-1)$ is not a factor. 
Since the remainder is not 0, but is $-12$ when $x=1$, $(x-1)$ is not a factor.

When $x=-1$,

$y=(-1)^3-7(-1)-6=0$
Since the remainder here is 0 when $x=-1$, we can say that $(x+1)$ is a factor.
* Here, $([-1]+1)=0$, so the factor is $(x+1)$, not $(x-1)$. Common mistake made. Don't fuck up.

There are some other methods as well,

### Long Division Method!!! 

~~~
This is something I still need to figure out
~~~
![[mcv4u_01.01.08.svg|350]]

[[1.1 Reviewing Prerequisite Skills Questions]]\
#needswork












 
 
 
 